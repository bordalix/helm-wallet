import Decimal from 'decimal.js'
import { selectCoins } from './coinSelection'
import { Wallet } from '../providers/wallet'

export const claimFees = 0.1
export const discountCT = true

const satsVbyte = 0.011

const vbyteSize = (numCoins: number) => 2418 + numCoins * 85

export const feeForCoins = (numCoins: number) => {
  return Decimal.ceil(Decimal.mul(vbyteSize(numCoins), satsVbyte)).toNumber()
}

export const feesToSendSats = (sats: number, wallet: Wallet): number => {
  if (sats === 0) return 0
  const { coins } = selectCoins(sats, wallet.utxos[wallet.network])
  return feeForCoins(coins.length)
}
