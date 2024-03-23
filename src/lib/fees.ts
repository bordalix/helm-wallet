import Decimal from 'decimal.js'

export const satsVbyte = 0.11

const vbyteSize = (numCoins: number) => 2418 + numCoins * 85

export const feeForCoins = (numCoins: number) => Decimal.ceil(Decimal.mul(vbyteSize(numCoins), satsVbyte)).toNumber()
