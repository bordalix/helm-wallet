import { Wallet } from '../providers/wallet'
import { NewAddress, generateAddress } from './address'
import { unblindOutput } from './blinder'
import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import * as liquid from 'liquidjs-lib'
import { ChainSource, ElectrumBlockHeader, ElectrumHistory, ElectrumTransaction } from './chainsource'

const cached = {
  blockHeaders: <ElectrumBlockHeader[]>[],
  electrumTxs: <ElectrumTransaction[]>[],
  txHexas: <{ txid: string; hex: string }[]>[],
}

const getElectrumTransactions = async (history: ElectrumHistory[], chainSource: ChainSource) => {
  const toFetch = history.filter((h) => !cached.electrumTxs.find((t) => t.tx_hash === h.tx_hash))
  if (toFetch) {
    for (const tx of await chainSource.fetchTransactions(toFetch)) {
      if (!cached.electrumTxs.find((t) => t.tx_hash === tx.tx_hash)) cached.electrumTxs.push(tx)
    }
  }
  return history.map((h): ElectrumTransaction => cached.electrumTxs.find((t) => t.tx_hash === h.tx_hash)!)
}

const getBlockHeader = async (height: number, chainSource: ChainSource): Promise<ElectrumBlockHeader> => {
  const inCache = cached.blockHeaders.find((bh) => bh.height === height)
  if (inCache) return inCache
  const bh = await chainSource.fetchBlockHeader(height)
  cached.blockHeaders.push(bh)
  return bh
}

const getTransaction = async (txid: string, chainSource: ChainSource): Promise<string> => {
  const inCache = cached.txHexas.find((tx) => tx.txid === txid)
  if (inCache) return inCache.hex
  const hex = await chainSource.fetchSingleTransaction(txid)
  cached.txHexas.push({ txid, hex })
  return hex
}

const getOutputAmount = async (address: NewAddress, txHex: string, chainSource: ChainSource) => {
  let amount = 0
  const tx = liquid.Transaction.fromHex(txHex)
  for (const vin of tx.ins) {
    const witnessPubkey = vin.witness[1] ? vin.witness[1].toString('hex') : undefined
    if (witnessPubkey === address.pubkey.toString('hex')) {
      const hex = await getTransaction(vin.hash.reverse().toString('hex'), chainSource)
      const { value } = await unblindOutput(vin.index, hex, address.blindingKeys)
      amount -= Number(value)
    }
  }
  for (const [idx, vout] of tx.outs.entries()) {
    if (vout.script.toString('hex') === address.script.toString('hex')) {
      const { value } = await unblindOutput(idx, txHex, address.blindingKeys)
      amount += Number(value)
    }
  }
  return amount
}

export interface History {
  address: NewAddress
  history: ElectrumHistory[]
}

export const getHistories = async (chainSource: ChainSource, wallet: Wallet) => {
  const { gapLimit } = wallet
  const uniqueTxHashes = new Set()
  let emptyAddrInARow = 0
  let histories: History[] = []
  let index = 0

  while (emptyAddrInARow < gapLimit) {
    // generate address
    const address = await generateAddress(wallet, index)
    if (!address.address || !address.blindingKeys) throw new Error('Could not generate new address')
    // get address history
    const history = await chainSource.fetchHistories([address.script])
    // push to return object
    if (history.length > 0) {
      histories.push({ address, history })
      history.map((h) => uniqueTxHashes.add(h.tx_hash))
    }
    // update emptyAddrInARow and index
    emptyAddrInARow = history.length === 0 ? emptyAddrInARow + 1 : 0
    index += 1
  }

  return { histories, numTxs: uniqueTxHashes.size }
}

export const restore = async (chainSource: ChainSource, histories: History[], update?: () => void) => {
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []
  const lastIndex = histories.reduce((prev, curr) => (curr.address.nextIndex > prev ? curr.address.nextIndex : prev), 0)

  for (const h of histories) {
    const { address, history } = h

    const txs = await getElectrumTransactions(history, chainSource)
    // const txs = await chainSource.fetchTransactions(history)

    for (const tx of txs) {
      const timestamp = tx.height > 0 ? (await getBlockHeader(tx.height, chainSource)).timestamp : 0
      const amount = await getOutputAmount(address, tx.hex, chainSource)
      const existingTx = transactions.find((t) => t.txid === tx.tx_hash)
      if (existingTx) existingTx.amount += amount
      else {
        transactions.push({
          amount,
          date: prettyUnixTimestamp(timestamp),
          hex: tx.hex,
          txid: tx.tx_hash,
          unixdate: timestamp,
        })
      }
    }

    for (const u of await chainSource.listUtxos(address.script)) {
      const txHex = transactions.find((t) => t.txid === u.txid)?.hex
      if (!txHex) {
        // eslint-disable-next-line no-console
        console.warn('Unknown txHex for txid', u.txid)
        continue
      }
      const unblinded = await unblindOutput(u.vout, txHex, address.blindingKeys)
      utxos.push({
        ...u,
        ...unblinded,
        address: address.address,
        asset: unblinded.asset.reverse().toString('hex'),
        blindingPublicKey: address.blindingKeys.publicKey,
        blindingPrivateKey: address.blindingKeys.privateKey,
        nextIndex: address.nextIndex,
        pubkey: address.pubkey,
        script: address.script,
        value: Number(unblinded.value),
      })
    }

    if (update) update()
  }

  const uniqueTx = transactions
    .filter((value, index, self) => index === self.findIndex((t) => t.txid === value.txid))
    .map(({ amount, date, txid, unixdate }) => ({ amount, date, txid, unixdate }))

  return { nextIndex: lastIndex + 1, transactions: uniqueTx, utxos }
}
