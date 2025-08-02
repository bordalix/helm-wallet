/**
 * @jest-environment ./config/jest/uint8array-environment
 */

import { describe, it, expect } from 'vitest'
import { decode, isBip21 } from '../lib/bip21'
import { decodeInvoice, isLnInvoice } from '../lib/lightning'
import { isLiquidAddress } from '../lib/liquid'
import { getCallbackUrl, isValidLnUrl } from '../lib/lnurl'
import { NetworkName } from '../lib/network'

import fixtures from './fixtures.json' assert { type: 'json' }
const { bip21, liquid, lightning } = fixtures

describe('Bip21', () => {
  const addr = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

  it('isBip21', () => {
    expect(isBip21(addr)).toBeTruthy()
    expect(isBip21('xxxxx')).toBeFalsy()
    expect(isBip21('bitcoin')).toBeFalsy()
    expect(isBip21('bitcoin:')).toBeTruthy()
    expect(isBip21('bitcoin:x')).toBeTruthy()
  })

  it('decode valid', () => {
    bip21.valid.forEach(({ uri, res }: any) => {
      expect(() => decode(uri)).not.toThrow()
      if (res.address) expect(decode(uri).address).toBe(res.address)
      if (res.amount) expect(decode(uri).amount).toBe(res.amount)
    })
  })

  it('decode invalid', () => {
    bip21.invalid.forEach(({ uri, exception }: any) => {
      expect(() => decode(uri)).toThrow(exception)
    })
  })

  it('decode', () => {
    expect(decode(addr).amount).toBeUndefined()
    expect(() => decode(`${addr}?amount=abc`)).toThrow()
    expect(decode(`${addr}?amount=21`).amount).toBe(2100000000)
    expect(decode(`${addr}?amount=0.00000021`).amount).toBe(21)
  })
})

describe('Lightning', () => {
  const note = 'The quick brown fox jumps over the lazy dog'
  const paymentHash = 'da9fa986cf48f56ad387495f8e840ea9ed10889bf82f67c8a7b10d5d8a27886c'
  const invoice =
    'lnbc21u1pnk8larsp526g88ejh9ac0es9j6juxwenzdzvs6hcrphna5pp3jefpukmtk3hqpp5m206npk0fr6k45u8f90capqw48k3pzymlqhk0j98kyx4mz383pkqdz9235x2gr3w45kx6eqvfex7amwypnx77pqdf6k6urnyphhvetjyp6xsefqd3sh57fqv3hkwxqyp2xqcqz95rzjqv9ruzr6quwpsuwmyshlvenk0xm7djrtt8ugt2ja6cx3dkqtccdgvzzxeyqq28qqqqqqqqqqqqqqq9gq2y9qyysgqvu5k5w9q0xe62envhds058r9h8v5uak09hn3uzlw39sqkcuwh34j44gc53j6x6sg0u6yf6l0durxqqekytupxpf66zc7rc9cpav72ssqpcgv3p'

  it('decodeInvoice', () => {
    expect(() => decodeInvoice('xxx')).toThrow()
    expect(decodeInvoice(invoice)).toBeDefined()
    expect(decodeInvoice(invoice).invoice).toBe(invoice)
    expect(decodeInvoice(invoice).magicHint).toBeDefined()
    expect(decodeInvoice(invoice).note).toBe(note)
    expect(decodeInvoice(invoice).paymentHash).toBe(paymentHash)
    expect(decodeInvoice(invoice).satoshis).toBe(2100)
  })

  it('decode valid invoices', () => {
    lightning.valid.forEach(({ invoice, res }: any) => {
      expect(() => decodeInvoice(invoice)).not.toThrow()
      if (res.note) expect(decodeInvoice(invoice).note).toBe(res.note)
      if (res.paymentHash) expect(decodeInvoice(invoice).paymentHash).toBe(res.paymentHash)
      if (res.satoshis) expect(decodeInvoice(invoice).satoshis).toBe(res.satoshis)
    })
  })

  it('isLnInvoice', () => {
    expect(isLnInvoice('abc')).toBeFalsy()
    expect(isLnInvoice(invoice)).toBeTruthy()
  })
})

describe('Liquid', () => {
  it('isLiquidAddress', () => {
    liquid.legacy.forEach(({ cleartext, confidential }) => {
      expect(isLiquidAddress(cleartext, NetworkName.Regtest)).toBeTruthy()
      expect(isLiquidAddress(confidential, NetworkName.Regtest)).toBeTruthy()
    })
    liquid.blech32.forEach(({ cleartext, confidential }) => {
      expect(isLiquidAddress(cleartext, NetworkName.Regtest)).toBeTruthy()
      expect(isLiquidAddress(confidential, NetworkName.Regtest)).toBeTruthy()
    })
  })
})

describe('LnUrl', () => {
  const urls = {
    alby: {
      str: 'LNURL1DP68GURN8GHJ7EM9W3SKCCNE9E3K7MF0D3H82UNVWQHK7MNVV45KUETNH9QHJA',
      url: 'https://getalby.com/lnurlp/onleines',
    },
    coinos: {
      str: 'bordalix@coinos.io',
      url: 'https://coinos.io/.well-known/lnurlp/bordalix',
    },
  }

  it('isValidLnUrl', () => {
    expect(isValidLnUrl('xxxxxx')).toBeFalsy()
    expect(isValidLnUrl('bordalix')).toBeFalsy()
    expect(isValidLnUrl('bordalix@')).toBeFalsy()
    expect(isValidLnUrl('bordalix@co')).toBeFalsy()
    expect(isValidLnUrl(urls.alby.str)).toBeTruthy()
    expect(isValidLnUrl(urls.coinos.str)).toBeTruthy()
  })

  it('getCallbackUrl', () => {
    expect(getCallbackUrl(urls.alby.str)).toBe(urls.alby.url)
    expect(getCallbackUrl(urls.coinos.str)).toBe(urls.coinos.url)
  })
})
