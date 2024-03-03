import { Satoshis } from './types'
import { Decimal } from 'decimal.js'

export const formatInvoice = (invoice: string, showChars = 14): string => {
  if (!invoice) return ''
  return `${invoice.substring(0, showChars)}...${invoice.substring(invoice.length - showChars, invoice.length)}`
}

export const prettyNumber = (num: number): string => {
  return new Intl.NumberFormat('en', { style: 'decimal', maximumFractionDigits: 8 }).format(num)
}

export const fromSatoshis = (num: Satoshis): number => {
  return Decimal.div(num, 100_000_000).toNumber()
}

export const toSatoshis = (num: number): Satoshis => {
  return Decimal.mul(num, 100_000_000).toNumber()
}
