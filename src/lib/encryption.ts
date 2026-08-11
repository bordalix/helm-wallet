import * as crypto from 'crypto'
import { scrypt } from 'scrypt-js'

export const N = 16384
export const r = 8
export const p = 1
export const klen = 32

export interface Encrypted {
  data: string
  iv?: string
  tag?: string
  algo?: 'aes-256-gcm' | 'aes-256-cbc'
  options: ScryptOptions
}

export interface ScryptOptions {
  salt: string
  N: number
  r: number
  p: number
  klen: number
}

export function isLegacyEncrypted(encryptedData: Encrypted): boolean {
  return !(encryptedData.iv && encryptedData.tag)
}

function defaultScryptOptions(): ScryptOptions {
  return {
    N: 16384,
    r: 8,
    p: 1,
    klen: 32,
    salt: randomSalt(32),
  }
}

function randomSalt(length: number): string {
  return crypto.randomBytes(length).toString('hex')
}

const legacyIv = Buffer.from('f341557fcf9b9286', 'utf8')

/**
 * Encrypt data using scrypt + aes-256-gcm.
 * @param payload
 * @param password
 */
export async function encrypt(payload: string, password: string): Promise<Encrypted> {
  const options = defaultScryptOptions()
  const passwordDerived = await passwordToKey(password, options)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', passwordDerived, iv)
  let encrypted = cipher.update(payload, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    algo: 'aes-256-gcm',
    options,
  }
}

/**
 * Decrypt data using aes-256-gcm & scrypt.
 * Falls back to legacy aes-256-cbc payloads for backward compatibility.
 * @param encryptedData encrypted data to decrypt
 * @param password password using to decrypt
 */
export async function decrypt(encryptedData: Encrypted, password: string): Promise<string> {
  try {
    const passwordDerived = await passwordToKey(password, encryptedData.options)

    if (encryptedData.iv && encryptedData.tag) {
      const decipher = crypto.createDecipheriv('aes-256-gcm', passwordDerived, Buffer.from(encryptedData.iv, 'base64'))
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'))
      let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', passwordDerived, legacyIv)
    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // throw new Error('Invalid password')
  }
  return ''
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

function prepareForScrypt(str: string): Uint8Array {
  return Buffer.from(str.normalize('NFKD'))
}
