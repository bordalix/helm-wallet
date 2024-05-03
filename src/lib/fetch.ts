import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { BlindingKeyPair } from './blinder'
import { AddressTxInfo, fetchAddress, fetchAddressTxs, fetchAddressUtxos, fetchTxHex } from './explorers'
import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import * as liquid from 'liquidjs-lib'
import { defaultGapLimit } from './constants'
import { getOutputValueNumber, getUnblindedOutput } from './output'

export const fetchURL = async (url: string): Promise<any> => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return (await res.json()) as any
}

// This functions are for the REST API
//
// After the migration to websocket, these functionalities
// are taken care of by the functions at lib/restore

export interface HistoryResponse {
  nextIndex: number
  transactions: Transaction[]
  utxos: Utxo[]
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
      const txHex = await fetchTxHex(vin.txid, wallet)
      const value = await getOutputValueNumber(vin.vout, txHex, blindingKeys)
      return -Number(value)
    }
  }
  for (let i = 0; txInfo.vout[i]; i++) {
    const vout = txInfo.vout[i]
    if (vout.scriptpubkey_address === address) {
      const txHex = await fetchTxHex(txInfo.txid, wallet)
      const value = await getOutputValueNumber(i, txHex, blindingKeys)
      return Number(value)
    }
  }
  return 0
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
        const txHex = await fetchTxHex(utxo.txid, wallet)
        const unblinded = await getUnblindedOutput(utxo.vout, txHex, blindingKeys)
        const script = liquid.address.toOutputScript(address)
        utxos.push({
          ...utxo,
          ...unblinded,
          address,
          asset: Buffer.from(unblinded.asset).reverse().toString('hex'),
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
