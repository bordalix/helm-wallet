import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { BlindingKeyPair, unblindOutput } from './blinder'
import { AddressTxInfo, fetchAddress, fetchAddressTxs, fetchAddressUtxos } from './explorers'
import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import * as liquid from 'liquidjs-lib'
import { defaultGapLimit } from './constants'
import { ChainSource } from './chainsource'
import { number } from 'liquidjs-lib/src/script'

export const fetchURL = async (url: string): Promise<any> => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return (await res.json()) as any
}

export const postData = async (url: string, data = {}): Promise<any> => {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return (await res.json()) as any
}

const getTransactionAmount = async (
  address: string,
  blindingKeys: BlindingKeyPair,
  txInfo: AddressTxInfo,
  wallet: Wallet,
): Promise<number> => {
  const utxo = wallet.utxos[wallet.network].find((u) => u.address === address && u.txid === txInfo.txid)
  if (utxo) return utxo.value
  for (const vin of txInfo.vin) {
    if (vin.prevout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(vin.txid, vin.vout, blindingKeys, wallet)
      return -Number(value)
    }
  }
  for (let i = 0; txInfo.vout[i]; i++) {
    const vout = txInfo.vout[i]
    if (vout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(txInfo.txid, i, blindingKeys, wallet)
      return Number(value)
    }
  }
  return 0
}

export interface HistoryResponse {
  nextIndex: number
  transactions: Transaction[]
  utxos: Utxo[]
}

export const fetchHistory = async (wallet: Wallet): Promise<HistoryResponse> => {
  const txids: Record<string, Transaction[]> = {}
  const transactions: Transaction[] = []
  let utxos: Utxo[] = []
  let index = 0
  let lastIndexWithTx = 0
  let gap = wallet.gapLimit

  while (gap > 0) {
    const { address, blindingKeys, nextIndex, pubkey } = await generateAddress(wallet, index)
    if (!address || !blindingKeys) throw new Error('Could not generate new address')
    const data = await fetchAddress(address, wallet)
    if (data?.chain_stats?.tx_count > 0 || data?.mempool_stats?.tx_count > 0) {
      gap = defaultGapLimit // resets gap
      lastIndexWithTx = index
      for (const txInfo of await fetchAddressTxs(address, wallet)) {
        if (!txids[txInfo.txid]) txids[txInfo.txid] = []
        txids[txInfo.txid].push({
          amount: await getTransactionAmount(address, blindingKeys, txInfo, wallet),
          date: prettyUnixTimestamp(txInfo.status.block_time),
          unixdate: txInfo.status.block_time,
          txid: txInfo.txid,
        })
      }
      for (const utxo of await fetchAddressUtxos(address, wallet)) {
        const unblinded = await unblindOutput(utxo.txid, utxo.vout, blindingKeys, wallet)
        const script = liquid.address.toOutputScript(address)
        utxos.push({
          ...utxo,
          ...unblinded,
          address,
          asset: unblinded.asset.reverse().toString('hex'),
          blindingPublicKey: blindingKeys.publicKey,
          blindingPrivateKey: blindingKeys.privateKey,
          nextIndex,
          pubkey,
          script,
          value: Number(unblinded.value),
        })
      }
    }
    index += 1
    gap -= 1
  }

  // filter lbtc utxos
  const lbtc = liquid.networks[wallet.network].assetHash
  const lbtcUtxos = utxos.filter((utxo) => utxo.asset === lbtc)

  // aggregate transactions by txid
  for (const id of Object.keys(txids)) {
    const first = txids[id][0]
    const amount = txids[id].length === 1 ? first.amount : txids[id].reduce((prev, curr) => curr.amount + prev, 0)
    transactions.push({ ...first, amount })
  }

  return { nextIndex: lastIndexWithTx + 1, transactions, utxos: lbtcUtxos }
}

export const fetchHistoryWS = async (chainSource: ChainSource, wallet: Wallet): Promise<void> => {
  console.log('fetchHistories')

  const nextBlockOfAddresses = async (start: number, num: number) => {
    console.log('bloco', start, num)
    const addrs = []
    for (let i = start; i < start + num; i++) {
      const { address, blindingKeys, nextIndex, pubkey, script } = await generateAddress(wallet, i)
      if (!address || !blindingKeys) throw new Error('Could not generate new address')
      addrs.push({ address, blindingKeys, nextIndex, pubkey, script })
    }
    const data = await chainSource.fetchHistories(addrs.map((a) => a.script))
    const txids: string[] = []
    data.map((x) => x.map((y) => txids.push(y.tx_hash)))
    const txs = await chainSource.fetchTransactions(txids)
    return { addrs, txs }
  }

  const allAddressesAndTxs = async () => {
    let start = 0
    let empty = false
    let addresses: any[] = []
    let transactions: any[] = []

    const { addrs, txs } = await nextBlockOfAddresses(start, wallet.nextIndex[wallet.network])
    addresses = addrs
    transactions = txs

    start = wallet.nextIndex[wallet.network]

    do {
      const { addrs, txs } = await nextBlockOfAddresses(start, wallet.gapLimit)
      addresses = [...addresses, ...addrs]
      transactions = [...transactions, ...txs]
      if (txs.length === 0) empty = true
      else start = start + wallet.gapLimit
    } while (!empty)

    return { addresses, transactions }
  }

  console.log(await allAddressesAndTxs())
}
