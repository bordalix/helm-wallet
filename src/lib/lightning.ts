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

const extractNote = (data: string): string => {
  if (!/^\[/.test(data)) return data
  try {
    return JSON.parse(data)[0][1]
  } catch {
    return ''
  }
}

export const decodeInvoice = (invoice: string): Invoice => {
  const decoded = bolt11.decode(invoice)
  const millisats = Number(decoded.sections.find((s) => s.name === 'amount')?.value ?? '0')
  const description = decoded.sections.find((s) => s.name === 'description')?.value ?? ''
  const paymentHash = decoded.sections.find((s) => s.name === 'payment_hash')?.value ?? ''
  const routeHint = decoded.sections.find((s) => s.name === 'route_hint')?.value ?? []
  return {
    invoice,
    paymentHash,
    note: extractNote(description),
    magicHint: routeHint.find((x: any) => x.short_channel_id === '0846c900051c0000'),
    satoshis: Math.floor(millisats / 1000),
  }
}

export const isLnInvoice = (data: string) => data.toLowerCase().startsWith('ln')
