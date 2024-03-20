import { Encrypted, decrypt, encrypt } from './encryption'
import { Config } from '../providers/config'
import { Mnemonic } from './types'
import { NetworkName, getNetworkNames } from './network'
import { ExplorerName } from './explorers'
import { Wallet } from '../providers/wallet'

export interface SettingsData {
  explorer: ExplorerName
  mnemonic: Mnemonic
  network: NetworkName
  password: string
}

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
  for (const [n] of getNetworkNames()) {
    for (const utxo of wallet.utxos[n]) {
      utxo.asset = Buffer.from(utxo.asset.data)
      utxo.assetBlindingFactor = Buffer.from(utxo.assetBlindingFactor.data)
      utxo.pubkey = Buffer.from(utxo.pubkey.data)
      utxo.script = Buffer.from(utxo.script.data)
      utxo.valueBlindingFactor = Buffer.from(utxo.valueBlindingFactor.data)
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
