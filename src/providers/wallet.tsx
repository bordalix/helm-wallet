import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveMnemonicToStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, NextIndexes, Transactions, Utxos, XPubs } from '../lib/types'
import { ExplorerName } from '../lib/explorers'
import { defaultExplorer, defaultGapLimit, defaultNetwork } from '../lib/constants'
import { ChainSource, WsElectrumChainSource } from '../lib/chainsource'
import { getHistories, restore } from '../lib/restore'

let chainSource = new WsElectrumChainSource(defaultExplorer, defaultNetwork)

export interface Wallet {
  explorer: ExplorerName
  gapLimit: number
  initialized: boolean
  lastUpdate: number
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
  loading: boolean
  reloading: boolean
  restoring: number
  increaseIndex: () => void
  logout: () => void
  reloadWallet: (w?: Wallet) => void
  restoreWallet: (w: Wallet) => void
  resetWallet: () => void
  setMnemonic: (m: Mnemonic) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  chainSource,
  changeExplorer: () => {},
  changeNetwork: () => {},
  loading: true,
  reloading: false,
  restoring: 0,
  increaseIndex: () => {},
  logout: () => {},
  reloadWallet: () => {},
  restoreWallet: () => {},
  resetWallet: () => {},
  setMnemonic: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { navigate } = useContext(NavigationContext)

  const [loading, setLoading] = useState(true)
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
    if (clone.explorer !== chainSource.explorer) {
      await chainSource.close()
      chainSource = new WsElectrumChainSource(clone.explorer, clone.network)
    }
    reloadWallet(clone)
  }

  const changeNetwork = async (networkName: NetworkName) => {
    const clone = { ...wallet, network: networkName }
    updateWallet(clone)
    if (clone.network !== chainSource.network) {
      await chainSource.close()
      chainSource = new WsElectrumChainSource(clone.explorer, clone.network)
    }
    if (wallet.initialized) restoreWallet(clone)
  }

  const increaseIndex = () => {
    const clone = { ...wallet }
    const currentValue = clone.nextIndex[wallet.network]
    clone.nextIndex[wallet.network] = currentValue + 1
    saveWalletToStorage(clone)
    setWallet(clone)
  }

  const logout = () => setMnemonic('')

  const reloadWallet = async (w?: Wallet) => {
    if (reloading) return
    setReloading(true)
    const clone = w ? { ...w } : { ...wallet }
    // use the next line to use the REST API
    // const { nextIndex, transactions, utxos } = await fetchHistory(clone)
    const { histories } = await getHistories(chainSource, clone)
    const { nextIndex, transactions, utxos } = await restore(chainSource, histories)
    clone.nextIndex[clone.network] = nextIndex
    clone.transactions[clone.network] = transactions
    clone.utxos[clone.network] = utxos
    clone.lastUpdate = Math.floor(Date.now() / 1000)
    updateWallet(clone)
    setReloading(false)
  }

  const restoreWallet = async (w: Wallet) => {
    if (restoring) return
    setRestoring(-1)
    const clone = { ...w }
    const { histories, numTxs } = await getHistories(chainSource, clone)
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
    updateWallet(defaultWallet)
    saveMnemonicToStorage('', 'password')
    navigate(Pages.Init)
  }

  const updateWallet = (data: Wallet) => {
    setWallet({ ...data, mnemonic: mnemonic.current })
    saveWalletToStorage(data)
  }

  useEffect(() => {
    if (!loading) return
    const wallet = readWalletFromStorage()
    updateWallet(wallet ?? defaultWallet)
    if (wallet?.initialized) reloadWallet(wallet)
    setLoading(false)
    navigate(wallet?.initialized ? Pages.Wallet : Pages.Init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <WalletContext.Provider
      value={{
        chainSource,
        changeExplorer,
        changeNetwork,
        loading,
        reloading,
        restoring,
        increaseIndex,
        logout,
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
