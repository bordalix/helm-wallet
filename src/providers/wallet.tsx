import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveMnemonicToStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, NextIndexes, Transactions, Utxos, XPubs } from '../lib/types'
import { ExplorerName } from '../lib/explorers'
import { defaultExplorer, defaultGapLimit, defaultNetwork } from '../lib/constants'
import { ChainSource, WsElectrumChainSource } from '../lib/chainsource'
import { reload, restore } from '../lib/restore'

let chainSource = new WsElectrumChainSource(defaultNetwork)

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
  loading: boolean
  reloading: boolean
  restoring: boolean
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
  loading: true,
  reloading: false,
  restoring: false,
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
  const [restoring, setRestoring] = useState(false)
  const [wallet, setWallet] = useState(defaultWallet)

  const mnemonic = useRef('')

  const setMnemonic = (m: Mnemonic) => {
    mnemonic.current = m
    setWallet({ ...wallet, mnemonic: m })
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
    const { nextIndex, transactions, utxos } = await reload(chainSource, clone)
    clone.nextIndex[wallet.network] = nextIndex
    clone.transactions[wallet.network] = transactions
    clone.utxos[wallet.network] = utxos
    clone.lastUpdate = Math.floor(Date.now() / 1000)
    updateWallet(clone)
    setReloading(false)
  }

  const restoreWallet = async (w: Wallet) => {
    if (restoring) return
    setRestoring(true)
    const clone = { ...w }
    const { nextIndex, transactions, utxos } = await restore(chainSource, clone)
    clone.nextIndex[wallet.network] = nextIndex
    clone.transactions[wallet.network] = transactions
    clone.utxos[wallet.network] = utxos
    clone.lastUpdate = Math.floor(Date.now() / 1000)
    updateWallet(clone)
    setRestoring(false)
  }

  const resetWallet = () => {
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
    const _wallet = readWalletFromStorage()
    updateWallet(_wallet ?? defaultWallet)
    setLoading(false)
    navigate(_wallet?.initialized ? Pages.Wallet : Pages.Init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // when network changes, connect to respective electrum server
  useEffect(() => {
    if (wallet.network && chainSource.network !== wallet.network) {
      chainSource
        .close()
        .then(() => {
          chainSource = new WsElectrumChainSource(wallet.network)
        })
        .catch(console.error)
    }
  }, [chainSource, wallet.network])

  return (
    <WalletContext.Provider
      value={{
        chainSource,
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
