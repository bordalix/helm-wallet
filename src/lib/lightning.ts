// @ts-ignore
import bolt11 from 'light-bolt11-decoder'

export interface Invoice {
  invoice?: string
  paymentHash?: string
  note?: string
  satoshis?: number
}

const findTag = (decoded: any, tag: string) => {
  if (decoded[tag]) return decoded[tag]
  return decoded.sections.find((a: any) => a.name === tag)?.value
}

export const decodeInvoice = (invoice: string): Invoice => {
  const decoded = bolt11.decode(invoice)
  const milisatoshis = findTag(decoded, 'amount')
  const paymentHash = findTag(decoded, 'payment_hash')
  return {
    invoice,
    paymentHash,
    note: findTag(decoded, 'description'),
    satoshis: Math.floor(milisatoshis / 1000),
  }
}
