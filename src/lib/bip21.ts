// https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
// bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]

import { toSatoshis } from './format'

export interface Bip21Decoded {
  address?: string
  amount?: number
  invoice?: string
  lnurl?: string
}

/** decode a bip21 uri */
export const decode = (uri: string): Bip21Decoded => {
  const result: Bip21Decoded = {
    address: undefined,
    amount: undefined,
    invoice: undefined,
    lnurl: undefined,
  }

  // use lowercase for consistency
  const bip21Url = uri.toLowerCase().trim()

  if (!bip21Url.startsWith('bitcoin:')) {
    throw new Error('Invalid BIP21 URI')
  }

  // remove 'bitcoin:' prefix
  const urlWithoutPrefix = bip21Url.slice(8)

  // split address and query parameters
  const queryString = urlWithoutPrefix.split('?')[1]

  if (queryString) {
    const params = new URLSearchParams(queryString)

    if (params.has('amount')) {
      const amount = parseFloat(params.get('amount')!)
      if (isNaN(amount) || amount < 0) throw new Error('Invalid amount')
      result.amount = toSatoshis(amount)
    }

    if (params.has('lightning')) {
      if (params.get('lightning')?.startsWith('lnurl')) {
        result.lnurl = params.get('lightning')!
      } else if (params.get('lightning')?.startsWith('ln')) {
        result.invoice = params.get('lightning')!
      }
    }

    if (params.has('liquidtestnet')) {
      result.address = params.get('liquidtestnet')!
    }

    if (params.has('liquidnetwork')) {
      result.address = params.get('liquidnetwork')!
    }
  }

  return result
}

export const isBip21 = (data: string): boolean => {
  try {
    decode(data)
    return true
  } catch (e) {
    return false
  }
}
