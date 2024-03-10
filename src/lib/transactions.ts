import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { BlindingKeyPair, unblindOutput } from './blinder'
import { AddressTxInfo, fetchAddress, fetchAddressTxs } from './explorers'
import { Transaction } from './types'

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
            amount: await getTransactionAmount(address, blindingKeys, txInfo, config, wallet),
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
