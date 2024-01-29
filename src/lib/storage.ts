import secureLocalStorage from 'react-secure-storage'
import { Encrypted, decrypt, encrypt } from './encryption'
import { Config } from '../providers/config'
import { Mnemonic } from './types'
import { NetworkName } from './networks'
import { ExplorerName } from './explorers'

export interface SettingsData {
  explorer: ExplorerName
  mnemonic: Mnemonic
  network: NetworkName
  password: string
}

export const saveSettings = async (settings: SettingsData, password = 'password') => {
  const encrypted = await encrypt(JSON.stringify(settings), password)
  secureLocalStorage.setItem('settings', encrypted)
}

export const getSettings = async (password = 'password'): Promise<{ empty: boolean; settings: SettingsData }> => {
  const encrypted = secureLocalStorage.getItem('settings') as Encrypted
  const decrypted = await decrypt(encrypted, password)
  let settings
  try {
    settings = JSON.parse(decrypted)
  } catch (_) {}
  return {
    empty: !encrypted,
    settings,
  }
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
