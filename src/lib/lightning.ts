// @ts-ignore
import { decode } from 'light-bolt11-decoder'
import { SendInfo } from '../providers/flow'

const findTag = (decoded: any, tag: string) => {
  if (decoded[tag]) return decoded[tag]
  return decoded.sections.find((a: any) => a.name === tag)?.value
}

export const decodeInvoice = (invoice: string): Omit<SendInfo, 'boltzFees' | 'txFees' | 'total'> => {
  const decoded = decode(invoice)
  const milisatoshis = findTag(decoded, 'amount')
  return {
    invoice,
    note: findTag(decoded, 'description'),
    satoshis: Math.floor(milisatoshis / 1000),
  }
}
