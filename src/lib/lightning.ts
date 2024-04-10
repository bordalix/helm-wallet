// @ts-ignore
import bolt11 from 'light-bolt11-decoder'

export interface MagicHint {
  cltv_expiry_delta: number
  fee_base_msat: number
  fee_proportional_millionths: number
  pubkey: string
  short_channel_id: string
}
export interface Invoice {
  invoice?: string
  paymentHash?: string
  note?: string
  magicHint?: MagicHint
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
  const routeHint = findTag(decoded, 'route_hint') ?? []
  const magicHint = routeHint.find((x: any) => x.short_channel_id === '0846c900051c0000')
  return {
    invoice,
    paymentHash,
    note: findTag(decoded, 'description'),
    magicHint,
    satoshis: Math.floor(milisatoshis / 1000),
  }
}
