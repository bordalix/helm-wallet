import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { BlindingKeyPair, unblindOutput } from './blinder'
import { AddressTxInfo, fetchAddress, fetchAddressTxs, fetchUtxos } from './explorers'
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
  const utxo = wallet.utxos.find((u) => u.address === address && u.txid === txInfo.txid)
  if (utxo) return utxo.value
  for (const vin of txInfo.vin) {
    if (vin.prevout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(vin.txid, vin.vout, blindingKeys, config)
      return -value
    }
  }
  for (let i = 0; txInfo.vout[i]; i++) {
    const vout = txInfo.vout[i]
    if (vout.scriptpubkey_address === address) {
      const { value } = await unblindOutput(txInfo.txid, i, blindingKeys, config)
      return value
    }
  }
  return 0
}

export const fetchHistory = async (
  config: Config,
  wallet: Wallet,
  defaultGap = 5,
): Promise<{ transactions: Transaction[]; utxos: Utxo[] }> => {
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []

  for (let chain = 0; chain < 2; chain++) {
    let index = 0
    let gap = defaultGap
    while (gap > 0) {
      const { address, blindingKeys } = await generateAddress(wallet, chain, index)
      if (!address || !blindingKeys) throw new Error('Could not generate new address')
      const data = await fetchAddress(address, config)
      console.log('address', address)
      console.log('data.chain_stats.tx_count', data.chain_stats.tx_count)
      console.log('data.mempool_stats.tx_count', data.mempool_stats.tx_count)
      if (data?.chain_stats?.tx_count > 0 || data?.mempool_stats?.tx_count > 0) {
        gap = defaultGap // resets gap
        for (const txInfo of await fetchAddressTxs(address, config)) {
          transactions.push({
            amount: await getTransactionAmount(address, blindingKeys, txInfo, config, wallet),
            date: txInfo.status.block_time,
            txid: txInfo.txid,
          })
        }
        for (const utxo of await fetchUtxos(address, config)) {
          const unblinded = await unblindOutput(utxo.txid, utxo.vout, blindingKeys, config)
          const script = liquid.address.toOutputScript(address)
          utxos.push({ ...utxo, ...unblinded, address, script, value: Number(unblinded.value) })
        }
      }
      index += 1
      gap -= 1
    }
  }
  const lbtc = liquid.networks[config.network].assetHash
  const lbtcUtxos = utxos.filter((utxo) => utxo.asset.reverse().toString('hex') === lbtc)
  return { transactions, utxos: lbtcUtxos }
}
