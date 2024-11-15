import { Encrypted, decrypt, encrypt } from './encryption'
import { Config } from '../providers/config'
import { networkNames } from './network'
import { Wallet } from '../providers/wallet'
import { CacheInfo } from './cache'
import { Claims } from './claims'

export const clearStorage = () => {
  return localStorage.clear()
}

export const saveConfigToStorage = (config: Config): void => {
  localStorage.setItem('config', JSON.stringify(config))
}

export const readConfigFromStorage = (): Config | undefined => {
  const config = localStorage.getItem('config')
  return config ? JSON.parse(config) : undefined
}

export const saveWalletToStorage = (wallet: Wallet): void => {
  if (wallet.mnemonic) wallet.mnemonic = ''
  localStorage.setItem('wallet', JSON.stringify(wallet))
}

export const readWalletFromStorage = (): Wallet | undefined => {
  const data = localStorage.getItem('wallet')
  if (!data) return undefined
  const wallet = JSON.parse(data)
  for (const [n] of networkNames) {
    for (const utxo of wallet.utxos[n]) {
      utxo.blindingPrivateKey = Buffer.from(utxo.blindingPrivateKey.data)
      utxo.blindingPublicKey = Buffer.from(utxo.blindingPublicKey.data)
      utxo.pubkey = Buffer.from(utxo.pubkey.data)
      utxo.script = Buffer.from(utxo.script.data)
      utxo.assetBlindingFactor = utxo.assetBlindingFactor ? Buffer.from(utxo.assetBlindingFactor.data) : null
      utxo.valueBlindingFactor = utxo.valueBlindingFactor ? Buffer.from(utxo.valueBlindingFactor.data) : null
      const p = utxo.prevout
      p.asset = Buffer.from(p.asset.data)
      p.nonce = Buffer.from(p.nonce.data)
      p.rangeProof = Buffer.from(p.rangeProof.data)
      p.script = Buffer.from(p.script.data)
      p.surjectionProof = Buffer.from(p.surjectionProof.data)
      p.value = Buffer.from(p.value.data)
    }
  }
  return wallet
}

export const saveMnemonicToStorage = async (mnemonic: string, password: string): Promise<void> => {
  const encrypted = await encrypt(mnemonic, password)
  localStorage.setItem('mnemonic', JSON.stringify(encrypted))
}

export const readMnemonicFromStorage = async (password: string): Promise<string | undefined> => {
  const encrypted = localStorage.getItem('mnemonic') as string
  return encrypted ? await decrypt(JSON.parse(encrypted) as Encrypted, password) : undefined
}

export const saveCacheToStorage = (cache: CacheInfo): void => {
  localStorage.setItem('cache', JSON.stringify(cache))
}

export const readCacheFromStorage = (): CacheInfo | undefined => {
  const cache = localStorage.getItem('cache')
  return cache ? JSON.parse(cache) : undefined
}

export const saveClaimsToStorage = (claims: Claims): void => {
  localStorage.setItem('claims', JSON.stringify(claims))
}

export const readClaimsFromStorage = (): Claims => {
  const claims = localStorage.getItem('claims')
  return claims ? JSON.parse(claims) : {}
}
