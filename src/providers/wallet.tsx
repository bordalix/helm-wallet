import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveMnemonicToStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, NextIndexes, Transactions, Utxos, XPubs } from '../lib/types'
import { ExplorerName } from '../lib/explorers'
import { defaultExplorer, defaultGapLimit, defaultNetwork } from '../lib/constants'
import { ChainSource, WsElectrumChainSource } from '../lib/chainsource'
import { restore } from '../lib/restore'
import { ConfigContext } from './config'
import { cleanCache, getCachedElectrumHistories } from '../lib/cache'
import { deleteExpiredClaims } from '../lib/claims'
import { ConnectionContext } from './connection'
import { checkTorConnection } from '../lib/tor'
import { cleanOldLogs, deleteLogs, logError } from '../lib/logs'
import { extractError } from '../lib/error'

let chainSource: ChainSource

export interface Wallet {
  explorer: ExplorerName
  gapLimit: number
  initialized: boolean
  lastUpdate: number
  lockedByBiometrics?: boolean
  masterBlindingKey?: string
  mnemonic: Mnemonic
  network: NetworkName
  nextIndex: NextIndexes
  passkeyId?: string
  transactions: Transactions
  utxos: Utxos
  xpubs: XPubs
}

const defaultWallet: Wallet = {
  explorer: defaultExplorer,
  gapLimit: defaultGapLimit,
  initialized: false,
  lastUpdate: 0,
  mnemonic: '',
  network: defaultNetwork,
  nextIndex: {
    [NetworkName.Liquid]: 0,
    [NetworkName.Regtest]: 0,
    [NetworkName.Testnet]: 0,
  },
  transactions: {
    [NetworkName.Liquid]: [],
    [NetworkName.Regtest]: [],
    [NetworkName.Testnet]: [],
  },
  utxos: {
    [NetworkName.Liquid]: [],
    [NetworkName.Regtest]: [],
    [NetworkName.Testnet]: [],
  },
  xpubs: {
    [NetworkName.Liquid]: '',
    [NetworkName.Regtest]: '',
    [NetworkName.Testnet]: '',
  },
}

interface WalletContextProps {
  changeExplorer: (e: ExplorerName) => void
  changeNetwork: (n: NetworkName) => void
  getChainSource: () => ChainSource
  increaseIndex: () => void
  loadingWallet: boolean
  logout: () => void
  reconnectChainSource: (w: Wallet) => void
  reloadWallet: (w: Wallet, quick?: boolean) => void
  reloading: boolean
  restoring: number
  restoreWallet: (w: Wallet) => void
  resetWallet: () => void
  setMnemonic: (m: Mnemonic) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  getChainSource: () => chainSource,
  changeExplorer: () => {},
  changeNetwork: () => {},
  increaseIndex: () => {},
  loadingWallet: true,
  logout: () => {},
  reloading: false,
  restoring: 0,
  reconnectChainSource: () => {},
  reloadWallet: () => {},
  restoreWallet: () => {},
  resetWallet: () => {},
  setMnemonic: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config, loadingConfig } = useContext(ConfigContext)
  const { offline, setTor } = useContext(ConnectionContext)
  const { navigate } = useContext(NavigationContext)

  const [loadingWallet, setLoadingWallet] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [restoring, setRestoring] = useState(0)
  const [wallet, setWallet] = useState(defaultWallet)

  const mnemonic = useRef('')

  const setMnemonic = (m: Mnemonic) => {
    mnemonic.current = m
    setWallet({ ...wallet, mnemonic: m })
  }

  const changeExplorer = async (explorer: ExplorerName) => {
    const clone = { ...wallet, explorer }
    updateWallet(clone)
    if (clone.explorer !== chainSource?.explorer) await reconnectChainSource(clone)
    reloadWallet(clone)
  }

  const changeNetwork = async (networkName: NetworkName) => {
    const clone = { ...wallet, network: networkName }
    updateWallet(clone)
    if (networkName !== NetworkName.Liquid) setTor(false)
    if (clone.network !== chainSource?.network) await reconnectChainSource(clone, config.tor)
    if (wallet.initialized) reloadWallet(clone)
  }

  const getChainSource = () => chainSource

  const increaseIndex = () => {
    const clone = { ...wallet }
    const currentValue = clone.nextIndex[wallet.network]
    clone.nextIndex[wallet.network] = currentValue + 1
    saveWalletToStorage(clone)
    setWallet(clone)
  }

  const logout = () => setMnemonic('')

  const reconnectChainSource = async (w: Wallet, tor = false) => {
    try {
      if (chainSource) await chainSource.close()
      chainSource = new WsElectrumChainSource(w.explorer, w.network, tor)
    } catch (e) {
      logError('Error reconnecting chainSource', extractError(e))
    }
  }

  const reloadWallet = async (w: Wallet) => {
    if (reloading) return
    setReloading(true)
    const clone = { ...w }
    // use the next line to use the REST API
    // const { nextIndex, transactions, utxos } = await fetchHistory(clone)
    const { histories } = await getCachedElectrumHistories(chainSource, clone)
    const { nextIndex, transactions, utxos } = await restore(chainSource, histories)
    clone.nextIndex[clone.network] = nextIndex
    clone.transactions[clone.network] = transactions
    clone.utxos[clone.network] = utxos
    clone.lastUpdate = Math.floor(Date.now() / 1000)
    updateWallet(clone)
    setReloading(false)
    deleteExpiredClaims(chainSource, clone.network)
    cleanOldLogs()
  }

  const restoreWallet = async (w: Wallet) => {
    if (restoring) return
    setRestoring(-1)
    const clone = { ...w }
    const { histories, numTxs } = await getCachedElectrumHistories(chainSource, clone)
    setRestoring(numTxs)
    const update = () => setRestoring((r) => r - 1)
    const { nextIndex, transactions, utxos } = await restore(chainSource, histories, update)
    clone.nextIndex[clone.network] = nextIndex
    clone.transactions[clone.network] = transactions
    clone.utxos[clone.network] = utxos
    clone.lastUpdate = Math.floor(Date.now() / 1000)
    updateWallet(clone)
    setRestoring(0)
  }

  const resetWallet = () => {
    logout()
    cleanCache()
    deleteLogs()
    updateWallet(defaultWallet)
    saveMnemonicToStorage('', 'password')
    navigate(Pages.Init)
  }

  const updateWallet = (data: Wallet) => {
    setWallet({ ...data, mnemonic: mnemonic.current })
    saveWalletToStorage(data)
  }

  // load wallet from storage after config is loaded
  useEffect(() => {
    if (loadingConfig || !loadingWallet) return
    updateWallet(readWalletFromStorage() ?? defaultWallet)
    setLoadingWallet(false)
  }, [loadingConfig])

  // reconnect to websocket server if:
  // - wallet is loaded
  // - wallet becomes online/offline
  // - tor is enabled/disabled
  useEffect(() => {
    if (loadingWallet) return
    if (offline) {
      if (reloading) setReloading(false)
      if (chainSource) chainSource.close().catch()
    } else {
      reconnectChainSource(wallet, config.tor).then(() => {
        if (wallet.initialized) reloadWallet(wallet)
      })
    }
    navigate(wallet.initialized ? Pages.Wallet : Pages.Init)
  }, [loadingWallet, offline, config.tor])

  // if user changes network to testnet or regtest, set tor to false
  useEffect(() => {
    if (loadingWallet) return
    if (config.tor && wallet.network === NetworkName.Liquid) checkTorConnection().then(setTor)
    else setTor(false)
  }, [config.tor, loadingWallet, wallet.network])

  return (
    <WalletContext.Provider
      value={{
        changeExplorer,
        changeNetwork,
        getChainSource,
        loadingWallet,
        reloading,
        restoring,
        increaseIndex,
        logout,
        reconnectChainSource,
        reloadWallet,
        restoreWallet,
        resetWallet,
        setMnemonic,
        updateWallet,
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
