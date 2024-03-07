import secureLocalStorage from 'react-secure-storage'
import { Encrypted, decrypt, encrypt } from './encryption'
import { Config } from '../providers/config'
import { Mnemonic } from './types'
import { NetworkName } from './network'
import { ExplorerName } from './explorers'
import { Wallet } from '../providers/wallet'

export interface SettingsData {
  explorer: ExplorerName
  mnemonic: Mnemonic
  network: NetworkName
  password: string
}

export const clearStorage = () => {
  return secureLocalStorage.clear()
}

export const saveConfigToStorage = async (config: Config, password = 'password'): Promise<void> => {
  const encrypted = await encrypt(JSON.stringify(config), password)
  secureLocalStorage.setItem('config', encrypted)
}

export const readConfigFromStorage = async (password = 'password'): Promise<Config | undefined> => {
  const encrypted = secureLocalStorage.getItem('config') as Encrypted
  const decrypted = await decrypt(encrypted, password)
  let settings
  try {
    settings = JSON.parse(decrypted)
  } catch (_) {}
  return settings
}

export const saveWalletToStorage = async (wallet: Wallet, password = 'password'): Promise<void> => {
  const encrypted = await encrypt(JSON.stringify(wallet), password)
  secureLocalStorage.setItem('wallet', encrypted)
}

export const readWalletFromStorage = async (password = 'password'): Promise<Wallet | undefined> => {
  const encrypted = secureLocalStorage.getItem('wallet') as Encrypted
  const decrypted = await decrypt(encrypted, password)
  let wallet
  try {
    wallet = JSON.parse(decrypted)
  } catch (_) {}
  return wallet
}

export const saveMnemonicToStorage = async (mnemonic: string, password: string): Promise<void> => {
  const encrypted = await encrypt(mnemonic, password)
  secureLocalStorage.setItem('mnemonic', encrypted)
}

export const readMnemonicFromStorage = async (password: string): Promise<string> => {
  const encrypted = secureLocalStorage.getItem('mnemonic') as Encrypted
  return await decrypt(encrypted, password)
}
