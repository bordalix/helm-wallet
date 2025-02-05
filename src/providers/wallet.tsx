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
import { extractError } from '../lib/error'
import { deleteExpiredClaims } from '../lib/claims'

let chainSource = new WsElectrumChainSource(defaultExplorer, defaultNetwork)

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
  chainSource: ChainSource
  changeExplorer: (e: ExplorerName) => void
  changeNetwork: (n: NetworkName) => void
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
  toggleTor: (t: boolean) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  chainSource,
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
  toggleTor: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config, loadingConfig, updateConfig } = useContext(ConfigContext)
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

  const reconnectChainSource = async (w: Wallet, tor = false) => {
    chainSource
      .close()
      .then(() => (chainSource = new WsElectrumChainSource(w.explorer, w.network, tor)))
      .catch((e) => console.log('Error reconnecting chainSource', extractError(e)))
  }

  const changeExplorer = async (explorer: ExplorerName) => {
    const clone = { ...wallet, explorer }
    updateWallet(clone)
    if (clone.explorer !== chainSource.explorer) await reconnectChainSource(clone)
    reloadWallet(clone)
  }

  const changeNetwork = async (networkName: NetworkName) => {
    const clone = { ...wallet, network: networkName }
    updateWallet(clone)
    if (clone.network !== chainSource.network) await reconnectChainSource(clone, config.tor)
    if (wallet.initialized) reloadWallet(clone)
  }

  const increaseIndex = () => {
    const clone = { ...wallet }
    const currentValue = clone.nextIndex[wallet.network]
    clone.nextIndex[wallet.network] = currentValue + 1
    saveWalletToStorage(clone)
    setWallet(clone)
  }

  const logout = () => setMnemonic('')

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
    updateWallet(defaultWallet)
    saveMnemonicToStorage('', 'password')
    navigate(Pages.Init)
  }

  const toggleTor = (tor: boolean) => {
    reconnectChainSource(wallet, tor)
    updateConfig({ ...config, tor })
  }

  const updateWallet = (data: Wallet) => {
    setWallet({ ...data, mnemonic: mnemonic.current })
    saveWalletToStorage(data)
  }

  useEffect(() => {
    const getWalletFromStorage = async () => {
      if (!loadingWallet) return
      const wallet = readWalletFromStorage() ?? defaultWallet
      updateWallet(wallet)
      if (
        wallet.explorer !== chainSource.explorer ||
        wallet.network !== chainSource.network ||
        (wallet.network === NetworkName.Liquid && config.tor)
      ) {
        await reconnectChainSource(wallet, config.tor)
      }
      if (wallet.initialized) reloadWallet(wallet)
      setLoadingWallet(false)
      navigate(wallet.initialized ? Pages.Wallet : Pages.Init)
    }
    if (!loadingConfig) getWalletFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConfig, loadingWallet])

  return (
    <WalletContext.Provider
      value={{
        chainSource,
        changeExplorer,
        changeNetwork,
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
        toggleTor,
        updateWallet,
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
