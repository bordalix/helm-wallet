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

export const saveConfig = async (config: Config, password = 'password'): Promise<void> => {
  const encrypted = await encrypt(JSON.stringify(config), password)
  secureLocalStorage.setItem('config', encrypted)
}

export const readConfig = async (password = 'password'): Promise<Config | undefined> => {
  const encrypted = secureLocalStorage.getItem('config') as Encrypted
  const decrypted = await decrypt(encrypted, password)
  let settings
  try {
    settings = JSON.parse(decrypted)
  } catch (_) {}
  return settings
}

export const saveWallet = async (wallet: Wallet, password = 'password'): Promise<void> => {
  const encrypted = await encrypt(JSON.stringify(wallet), password)
  secureLocalStorage.setItem('wallet', encrypted)
}

export const readWallet = async (password = 'password'): Promise<Wallet | undefined> => {
  const encrypted = secureLocalStorage.getItem('wallet') as Encrypted
  const decrypted = await decrypt(encrypted, password)
  let wallet
  try {
    wallet = JSON.parse(decrypted)
  } catch (_) {}
  return wallet
}
