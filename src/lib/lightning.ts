// @ts-ignore
import bolt11 from 'bolt11'

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
  return decoded.tags.find((a: any) => a.tagName === tag)?.data
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
  const decoded = bolt11.decode(invoice.replace('lightning:', ''))
  let satoshis = findTag(decoded, 'satoshis')
  if (!satoshis) satoshis = Math.floor(Number(findTag(decoded, 'milisatoshis') ?? 0) / 1000)
  const routeInfo = findTag(decoded, 'routing_info') ?? []
  return {
    invoice,
    paymentHash: findTag(decoded, 'payment_hash'),
    note: extractNote(findTag(decoded, 'description')),
    magicHint: routeInfo.find((x: any) => x.short_channel_id === '0846c900051c0000'),
    satoshis,
  }
}
