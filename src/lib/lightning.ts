// @ts-ignore
import { decode } from 'light-bolt11-decoder'
import { SendInfo } from '../providers/flow'

const findTag = (decoded: any, tag: string) => {
  if (decoded[tag]) return decoded[tag]
  return decoded.sections.find((a: any) => a.name === tag)?.value
}

export const decodeInvoice = (invoice: string): SendInfo => {
  const decoded = decode(invoice)
  const milisatoshis = findTag(decoded, 'amount')
  return {
    satoshis: Math.floor(milisatoshis / 1000),
    note: findTag(decoded, 'description'),
    invoice,
  }
}
