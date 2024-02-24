import { networks } from 'liquidjs-lib'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { genAddress } from './address'
import { fetchAddress, fetchUtxos } from './explorers'
import { Mnemonic, Satoshis, Utxo } from './types'

export const getUtxos = async (config: Config, wallet: Wallet, defaultGap = 20): Promise<Utxo[]> => {
  const utxos: Utxo[] = []
  for (let chain = 0; chain < 2; chain++) {
    let index = 0
    let gap = defaultGap
    while (gap > 0) {
      const { address } = genAddress(wallet, index, chain)
      if (!address) throw new Error('Could not generate new address')
      const data = await fetchAddress(config, address)
      if (data?.chain_stats?.tx_count > 0) {
        gap = defaultGap // resets gap
        for (const utxo of await fetchUtxos(config, address)) {
          utxos.push(utxo)
        }
      }
      index += 1
      gap -= 1
    }
  }
  const lbtc = networks[config.network].assetHash
  return utxos.filter((utxo) => utxo.asset && utxo.value && utxo.asset === lbtc)
}

export const balance = (wallet: Wallet): Satoshis => {
  if (!wallet.utxos) return 0
  return wallet.utxos.reduce((prev, curr) => prev + curr.value, 0)
}

export const selectUtxos = (mnemonic: Mnemonic, amount: Satoshis) => {}
