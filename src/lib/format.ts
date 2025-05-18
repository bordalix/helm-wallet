import { Satoshis } from './types'
import { Decimal } from 'decimal.js'

export const formatInvoice = (invoice?: string, showChars = 14): string => {
  if (!invoice) return ''
  return `${invoice.substring(0, showChars)}...${invoice.substring(invoice.length - showChars, invoice.length)}`
}

export const prettyNumber = (num?: number, maximumFractionDigits = 8): string => {
  if (!num) return '0'
  return new Intl.NumberFormat('en', { style: 'decimal', maximumFractionDigits }).format(num)
}

export const prettyUnixTimestamp = (num: number): string => {
  if (!num) return ''
  const timestamp = num < 20_000_000_000 ? num : Math.floor(num / 1000)
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date)
}

export const fromSatoshis = (num: Satoshis = 0): number => {
  return Decimal.div(num, 100_000_000).toNumber()
}

export const toSatoshis = (num = 0): Satoshis => {
  return Decimal.mul(num, 100_000_000).toNumber()
}

export const prettyAgo = (someTime: number): string => {
  const timestamp = someTime < 20_000_000_000 ? someTime : Math.floor(someTime / 1000)
  const now = Math.floor(Date.now() / 1000)
  const delta = Math.floor(now - timestamp)
  if (delta > 86_400) {
    const days = Math.floor(delta / 86_400)
    return `${days}d ago`
  }
  if (delta > 3_600) {
    const hours = Math.floor(delta / 3_600)
    return `${hours}h ago`
  }
  if (delta > 60) {
    const minutes = Math.floor(delta / 60)
    return `${minutes}m ago`
  }
  if (delta === 0) return 'just now'
  const seconds = delta
  return `${seconds}s ago`
}

export const toUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str)
}
