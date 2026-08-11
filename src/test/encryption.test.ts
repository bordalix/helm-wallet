/**
 * @jest-environment ./config/jest/uint8array-environment
 */

import * as crypto from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import { scrypt } from 'scrypt-js'
import { Encrypted, ScryptOptions, decrypt, encrypt, isLegacyEncrypted } from '../lib/encryption'
import { readMnemonicFromStorage } from '../lib/storage'

const legacyIv = Buffer.from('f341557fcf9b9286', 'utf8')

function prepareForScrypt(str: string): Uint8Array {
  return Buffer.from(str.normalize('NFKD'))
}

async function passwordToKey(password: string, options: ScryptOptions): Promise<Uint8Array> {
  return scrypt(
    prepareForScrypt(password),
    prepareForScrypt(options.salt),
    options.N,
    options.r,
    options.p,
    options.klen,
  )
}

async function createLegacyEncrypted(payload: string, password: string): Promise<Encrypted> {
  const options: ScryptOptions = {
    salt: 'legacy-test-salt',
    N: 16384,
    r: 8,
    p: 1,
    klen: 32,
  }
  const passwordDerived = await passwordToKey(password, options)
  const cipher = crypto.createCipheriv('aes-256-cbc', passwordDerived, legacyIv)
  let encrypted = cipher.update(payload, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return {
    data: encrypted,
    options,
  }
}

describe('Encryption migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('encrypts with AES-GCM fields and decrypts correctly', async () => {
    const payload = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    const password = 'StrongPassword123!'

    const encrypted = await encrypt(payload, password)
    expect(encrypted.iv).toBeDefined()
    expect(encrypted.tag).toBeDefined()
    expect(isLegacyEncrypted(encrypted)).toBeFalsy()
    expect(await decrypt(encrypted, password)).toBe(payload)
  })

  it('decrypts legacy AES-CBC payloads', async () => {
    const payload = 'legal winner thank year wave sausage worth useful legal winner thank yellow'
    const password = 'LegacyPassword!'
    const legacyEncrypted = await createLegacyEncrypted(payload, password)

    expect(isLegacyEncrypted(legacyEncrypted)).toBeTruthy()
    expect(await decrypt(legacyEncrypted, password)).toBe(payload)
  })

  it('auto-migrates legacy mnemonic after successful read', async () => {
    const mnemonic = 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above'
    const password = 'MigrateMe!'
    const legacyEncrypted = await createLegacyEncrypted(mnemonic, password)

    localStorage.setItem('mnemonic', JSON.stringify(legacyEncrypted))

    const result = await readMnemonicFromStorage(password)
    expect(result).toBe(mnemonic)

    const stored = JSON.parse(localStorage.getItem('mnemonic') as string) as Encrypted
    expect(isLegacyEncrypted(stored)).toBeFalsy()
    expect(stored.iv).toBeDefined()
    expect(stored.tag).toBeDefined()
    expect(await decrypt(stored, password)).toBe(mnemonic)
  })
})
