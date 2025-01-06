import { fromSatoshis } from './format'
import { Satoshis } from './types'

export enum Unit {
  BTC = 'btc',
  EUR = 'eur',
  USD = 'usd',
  SAT = 'sat',
}

export const unitLabels = {
  [Unit.SAT]: 'Sats',
  [Unit.BTC]: 'BTC',
  [Unit.EUR]: 'EUR',
  [Unit.USD]: 'USD',
}

export const nextUnit = (unit: Unit | undefined) => {
  if (!unit) return Unit.SAT
  switch (unit) {
    case Unit.SAT:
      return Unit.BTC
    case Unit.BTC:
      return Unit.EUR
    case Unit.EUR:
      return Unit.USD
    case Unit.USD:
      return Unit.SAT
  }
}

export const satsFromUnit = (
  value: number,
  unit: string,
  fromEuro: (fiat: number) => Satoshis,
  fromUSD: (fiat: number) => Satoshis,
): Satoshis => {
  switch (unit) {
    case Unit.SAT:
      return Math.floor(value)
    case Unit.BTC:
      return Math.floor(fromSatoshis(value))
    case Unit.EUR:
      return Math.floor(fromEuro(value))
    case Unit.USD:
      return Math.floor(fromUSD(value))
    default:
      return Math.floor(value)
  }
}

export const satsToUnit = (
  sats: Satoshis,
  unit: string,
  toEuro: (sats: Satoshis) => number,
  toUSD: (sats: Satoshis) => number,
): number => {
  switch (unit) {
    case Unit.SAT:
      return sats
    case Unit.BTC:
      return fromSatoshis(sats)
    case Unit.EUR:
      return toEuro(sats)
    case Unit.USD:
      return toUSD(sats)
    default:
      return sats
  }
}
