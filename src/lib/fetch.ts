import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { BlindingKeyPair, unblindOutput } from './blinder'
import { AddressTxInfo, fetchAddress, fetchAddressTxs, fetchUtxos } from './explorers'
import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import * as liquid from 'liquidjs-lib'

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
  config: Config,
  wallet: Wallet,
): Promise<number> => {
  const utxo = wallet.utxos[wallet.network].find((u) => u.address === address && u.txid === txInfo.txid)
  if (utxo) return utxo.value
  for (const vin of txInfo.vin) {
    if (vin.prevout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(vin.txid, vin.vout, blindingKeys, config, wallet)
      return -value
    }
  }
  for (let i = 0; txInfo.vout[i]; i++) {
    const vout = txInfo.vout[i]
    if (vout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(txInfo.txid, i, blindingKeys, config, wallet)
      return value
    }
  }
  return 0
}

export interface HistoryResponse {
  nextIndex: number
  transactions: Transaction[]
  utxos: Utxo[]
}

export const fetchHistory = async (config: Config, wallet: Wallet, defaultGap = 5): Promise<HistoryResponse> => {
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []
  let index = 0
  let lastIndexWithTx = 0
  let gap = defaultGap
  while (gap > 0) {
    const { address, blindingKeys, pubkey } = await generateAddress(wallet, index)
    if (!address || !blindingKeys) throw new Error('Could not generate new address')
    const data = await fetchAddress(address, config, wallet)
    if (data?.chain_stats?.tx_count > 0 || data?.mempool_stats?.tx_count > 0) {
      gap = defaultGap // resets gap
      lastIndexWithTx = index
      for (const txInfo of await fetchAddressTxs(address, config, wallet)) {
        transactions.push({
          amount: await getTransactionAmount(address, blindingKeys, txInfo, config, wallet),
          date: prettyUnixTimestamp(txInfo.status.block_time),
          unixdate: txInfo.status.block_time,
          txid: txInfo.txid,
        })
      }
      for (const utxo of await fetchUtxos(address, config, wallet)) {
        const unblinded = await unblindOutput(utxo.txid, utxo.vout, blindingKeys, config, wallet)
        const script = liquid.address.toOutputScript(address)
        utxos.push({ ...utxo, ...unblinded, address, pubkey, script, value: Number(unblinded.value) })
      }
    }
    index += 1
    gap -= 1
  }
  const lbtc = liquid.networks[wallet.network].assetHash
  const lbtcUtxos = utxos.filter((utxo) => utxo.asset.reverse().toString('hex') === lbtc)
  return { nextIndex: lastIndexWithTx + 1, transactions, utxos: lbtcUtxos }
}
