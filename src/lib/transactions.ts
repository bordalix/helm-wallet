import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { AddressTxInfo, fetchAddress, fetchAddressTxs } from './explorers'
import { Transaction } from './types'

const getTransactionAmount = (address: string, txInfo: AddressTxInfo, wallet: Wallet): number => {
  const utxo = wallet.utxos.find((u) => u.address === address)
  if (utxo) return utxo.value
  for (const vin of txInfo.vin) {
    if (vin.prevout.scriptpubkey_address === address) return -21
  }
  for (const vout of txInfo.vout) {
    if (vout.scriptpubkey_address === address) return 21
  }
  return 0
}

export const getTransactions = async (config: Config, wallet: Wallet, defaultGap = 5): Promise<Transaction[]> => {
  const transactions: Transaction[] = []
  // TODO: cycle makes sense?
  for (let chain = 1; chain < 2; chain++) {
    let index = 0
    let gap = defaultGap
    while (gap > 0) {
      const { address, blindingKeys } = await generateAddress(wallet, index, chain)
      if (!address || !blindingKeys) throw new Error('Could not generate new address')
      const data = await fetchAddress(address, config)
      if (data?.chain_stats?.tx_count > 0) {
        gap = defaultGap // resets gap
        for (const txInfo of await fetchAddressTxs(address, config)) {
          console.log('txInfo', txInfo)
          transactions.push({
            amount: getTransactionAmount(address, txInfo, wallet),
            date: txInfo.status.block_time,
            txid: txInfo.txid,
          })
        }
      }
      index += 1
      gap -= 1
    }
  }
  return transactions
}
