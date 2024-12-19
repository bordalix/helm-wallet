/**
 * @jest-environment ./config/jest/uint8array-environment
 */

import { decode, isBip21 } from '../lib/bip21'
import { decodeInvoice, isLnInvoice } from '../lib/lightning'
import { isLiquidAddress } from '../lib/liquid'
import { getCallbackUrl, isValidLnUrl } from '../lib/lnurl'
import { NetworkName } from '../lib/network'

describe('Bip21', () => {
  const addr = 'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'

  test('isBip21', () => {
    expect(isBip21(addr)).toBeTruthy()
    expect(isBip21('xxxxx')).toBeFalsy()
    expect(isBip21('bitcoin')).toBeFalsy()
    expect(isBip21('bitcoin:')).toBeFalsy()
    expect(isBip21('bitcoin:x')).toBeFalsy()
  })
  test('decode', () => {
    expect(decode(addr).amount).toBeUndefined()
    expect(decode(addr).destination).toBeDefined()
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

  test('decodeInvoice', () => {
    expect(() => decodeInvoice('xxx')).toThrow()
    expect(decodeInvoice(invoice)).toBeDefined()
    expect(decodeInvoice(invoice).invoice).toBe(invoice)
    expect(decodeInvoice(invoice).magicHint).toBeDefined()
    expect(decodeInvoice(invoice).note).toBe(note)
    expect(decodeInvoice(invoice).paymentHash).toBe(paymentHash)
    expect(decodeInvoice(invoice).satoshis).toBe(2100)
  })

  test('isLnInvoice', () => {
    expect(isLnInvoice('abc')).toBeFalsy()
    expect(isLnInvoice(invoice)).toBeTruthy()
  })
})

describe('Liquid', () => {
  const addr = {
    legacy: {
      p2pkh: {
        cleartext: '2dtx9M8JhmtVFZr62KcwqtRG62nTgnoqyUp',
        confidential: 'CTEyDUYmBqW5FRYTfEkonToxUDHz1HmKJpikNeXBLA3CRTKxyK56ugXjH1BrJd9aFpFREhaTL4DbX5ob',
      },
      p2sh: {
        cleartext: 'XLz1KV9LJ41W6HwtEQXfXYVrL7W4aLBM9D',
        confidential: 'AzpvoF9fnsXoQgWk9bL6sBwyaSE3ceJgDHiynQgLCitck335jAqdkToXhtMNLHxRi7jf96cpfUCxs6QJ',
      },
    },
    blech32: {
      p2pkh: {
        cleartext: 'ert1qq8flcnrslw66p6z4058ezr5yetdwnce2y9tgr5',
        confidential:
          'el1qqdzy6068cj22t26pflxufhz5s4cgse6rml2e7hw3ctrl4gv0nlwm6qwnl3x8p7a45r592lg0jy8gfjk6a83j53qx8kjjky6sy',
      },
    },
  }

  test('isLiquidAddress', () => {
    expect(isLiquidAddress('xx', NetworkName.Regtest)).toBeFalsy()
    expect(isLiquidAddress(addr.legacy.p2pkh.cleartext, NetworkName.Regtest)).toBeTruthy()
    expect(isLiquidAddress(addr.legacy.p2pkh.confidential, NetworkName.Regtest)).toBeTruthy()
    expect(isLiquidAddress(addr.legacy.p2sh.cleartext, NetworkName.Regtest)).toBeTruthy()
    expect(isLiquidAddress(addr.legacy.p2sh.confidential, NetworkName.Regtest)).toBeTruthy()
    expect(isLiquidAddress(addr.blech32.p2pkh.cleartext, NetworkName.Regtest)).toBeTruthy()
    expect(isLiquidAddress(addr.blech32.p2pkh.confidential, NetworkName.Regtest)).toBeTruthy()
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

  test('isValidLnUrl', () => {
    expect(isValidLnUrl('xxxxxx')).toBeFalsy()
    expect(isValidLnUrl('bordalix')).toBeFalsy()
    expect(isValidLnUrl('bordalix@')).toBeFalsy()
    expect(isValidLnUrl('bordalix@co')).toBeFalsy()
    expect(isValidLnUrl(urls.alby.str)).toBeTruthy()
    expect(isValidLnUrl(urls.coinos.str)).toBeTruthy()
  })

  test('getCallbackUrl', () => {
    expect(getCallbackUrl(urls.alby.str)).toBe(urls.alby.url)
    expect(getCallbackUrl(urls.coinos.str)).toBe(urls.coinos.url)
  })
})
