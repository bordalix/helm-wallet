// https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
// bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]

import qs from 'qs'
import { toSatoshis } from './format'

const defaultScheme = 'lightning'

export interface Bip21Decoded {
  address?: string
  amount?: number
  destination?: string
  invoice?: string
  lnurl?: string
}

export const decode = (uri: string): Bip21Decoded => {
  if (!isBip21(uri)) throw new Error('Invalid BIP21 URI: ' + uri)
  let amount, destination, options, query
  const [scheme, rest] = uri.split(':')
  if (rest.indexOf('?') !== -1) {
    const split = rest.split('?')
    destination = split[0]
    query = split[1]
  } else {
    destination = rest
  }
  if (query) options = qs.parse(query)
  if (options?.amount) {
    amount = Number(options.amount)
    if (isNaN(amount) || !isFinite(amount) || amount < 0) throw new Error('Invalid amount')
    amount = toSatoshis(amount)
  }
  if (scheme === 'lightning') {
    if (destination.startsWith('lnurl')) return { amount, lnurl: destination }
    if (destination.startsWith('ln')) return { amount, invoice: destination }
  }
  if (scheme === 'liquidnetwork') return { amount, address: destination }
  if (scheme === 'liquidtestnet') return { amount, address: destination }
  if (scheme === 'bitcoin' && options?.liquidnetwork) return { amount, address: options.liquidnetwork as string }
  return { amount, destination }
}

export const encode = (destination: string, options: any = {}, scheme = defaultScheme) => {
  const query = qs.stringify(options)

  if (options.amount) {
    const amount = Number(options.amount)
    if (!isFinite(amount)) throw new TypeError('Invalid amount')
    if (amount < 0) throw new TypeError('Invalid amount')
  }

  return scheme + ':' + destination + (query ? '?' : '') + query
}

export const isBip21 = (data: string): boolean => {
  return /^\w+:.+/.test(data) // TODO
}
