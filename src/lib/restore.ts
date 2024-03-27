import { Wallet } from '../providers/wallet'
import { NewAddress, generateAddress } from './address'
import { unblindOutput } from './blinder'
import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import * as liquid from 'liquidjs-lib'
import { ChainSource } from './chainsource'

const getOutputAmount = async (address: NewAddress, txHex: string, chainSource: ChainSource) => {
  const tx = liquid.Transaction.fromHex(txHex)
  for (const vin of tx.ins) {
    const witnessPubkey = vin.witness[1] ? vin.witness[1].toString('hex') : undefined
    if (witnessPubkey === address.pubkey.toString('hex')) {
      const hex = await chainSource.fetchSingleTransaction(vin.hash.reverse().toString('hex'))
      const { value } = await unblindOutput(vin.index, hex, address.blindingKeys)
      return -Number(value)
    }
  }
  for (const [idx, vout] of tx.outs.entries()) {
    if (vout.script.toString('hex') === address.script.toString('hex')) {
      const { value } = await unblindOutput(idx, txHex, address.blindingKeys)
      return Number(value)
    }
  }
  return 0
}

export const reload = async (chainSource: ChainSource, wallet: Wallet) => {
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []
  const nextIndex = wallet.nextIndex[wallet.network]

  // generate all used addresses
  const addresses = []
  for (let i = 0; i < nextIndex; i++) {
    const a = await generateAddress(wallet, i)
    if (!a.address || !a.blindingKeys) throw new Error('Could not generate new address')
    addresses.push(a)
  }

  // query chain
  const history = await chainSource.fetchHistories(addresses.map((a) => a.script))
  const txs = await chainSource.fetchTransactions(history)

  // unique heights
  const heights = new Set()
  txs.filter((t) => t.height > 0).map((t) => heights.add(t.height))

  // get block headers
  const headers = []
  for (const height of heights.values()) {
    headers.push(await chainSource.fetchBlockHeader(height as number))
  }

  for (const a of addresses) {
    for (const tx of txs) {
      const timestamp = tx.height > 0 ? headers.find((h) => h.height === tx.height)?.timestamp ?? 0 : 0
      const amount = await getOutputAmount(a, tx.hex, chainSource)
      if (amount) {
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
    }

    for (const u of await chainSource.listUtxos(a.script)) {
      const txHex = transactions.find((t) => t.txid === u.txid)?.hex
      if (!txHex) throw new Error('Unknown txhex')
      const unblinded = await unblindOutput(u.vout, txHex, a.blindingKeys)
      utxos.push({
        ...u,
        ...unblinded,
        address: a.address,
        asset: unblinded.asset.reverse().toString('hex'),
        blindingPublicKey: a.blindingKeys.publicKey,
        blindingPrivateKey: a.blindingKeys.privateKey,
        nextIndex: a.nextIndex,
        pubkey: a.pubkey,
        script: a.script,
        value: Number(unblinded.value),
      })
    }
  }

  return { nextIndex, transactions, utxos }
}

export const restore = async (chainSource: ChainSource, wallet: Wallet) => {
  const { gapLimit } = wallet
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []
  let emptyTxInARow = 0
  let index = 0

  while (emptyTxInARow < gapLimit) {
    const a = await generateAddress(wallet, index)
    if (!a.address || !a.blindingKeys) throw new Error('Could not generate new address')

    const history = await chainSource.fetchHistories([a.script])
    const txs = await chainSource.fetchTransactions(history)
    emptyTxInARow = txs.length === 0 ? emptyTxInARow + 1 : 0

    for (const tx of txs) {
      const timestamp = tx.height > 0 ? (await chainSource.fetchBlockHeader(tx.height)).timestamp : 0
      const amount = await getOutputAmount(a, tx.hex, chainSource)
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

    for (const u of await chainSource.listUtxos(a.script)) {
      const txHex = transactions.find((t) => t.txid === u.txid)?.hex
      if (!txHex) throw new Error('Unknown txhex')
      const unblinded = await unblindOutput(u.vout, txHex, a.blindingKeys)
      utxos.push({
        ...u,
        ...unblinded,
        address: a.address,
        asset: unblinded.asset.reverse().toString('hex'),
        blindingPublicKey: a.blindingKeys.publicKey,
        blindingPrivateKey: a.blindingKeys.privateKey,
        nextIndex: a.nextIndex,
        pubkey: a.pubkey,
        script: a.script,
        value: Number(unblinded.value),
      })
    }
    index += 1
  }

  const uniqueTx = transactions
    .filter((value, index, self) => index === self.findIndex((t) => t.txid === value.txid))
    .map(({ amount, date, txid, unixdate }) => ({ amount, date, txid, unixdate }))

  return { nextIndex: index + 1 - gapLimit, transactions: uniqueTx, utxos }
}
