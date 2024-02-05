import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { genAddress } from './address'
import { deriveBlindingKey } from './blinder'
import { fetchAddress, fetchUtxos } from './explorers'
import { Unspent } from './types'

export const fetchUnspents = async (config: Config, wallet: Wallet): Promise<Unspent[]> => {
  console.log('listunspents')
  const unspents: Unspent[] = []
  const defaultGap = 20
  for (let chain = 0; chain < 2; chain++) {
    let gap = defaultGap,
      index = 0
    while (gap > 0) {
      const { address, output } = genAddress(wallet, index, chain)
      if (!address || !output) throw new Error('Could not generate new address')
      const data = await fetchAddress(config, address)
      if (data?.chain_stats?.tx_count > 0) {
        gap = defaultGap // resets gap
        const utxos = await fetchUtxos(config, address)
        if (utxos?.length) {
          const { privateKey: blindingPrivkey } = deriveBlindingKey(wallet.masterBlindingKey, output)
          unspents.push({ address, blindingPrivkey, chain, index, output, utxos })
        }
      }
      console.log(chain, index, data)
      index += 1
      gap -= 1
    }
  }
  return unspents
}
