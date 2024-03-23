import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, NextIndexes, Transactions, Utxos, XPubs } from '../lib/types'
import { fetchHistory } from '../lib/fetch'
import { ExplorerName } from '../lib/explorers'
import { defaultGapLimit } from '../lib/constants'

export interface Wallet {
  explorer: ExplorerName
  gapLimit: number
  initialized: boolean
  masterBlindingKey?: string
  mnemonic: Mnemonic
  network: NetworkName
  nextIndex: NextIndexes
  transactions: Transactions
  utxos: Utxos
  xpubs: XPubs
}

const defaultWallet: Wallet = {
  explorer: ExplorerName.Blockstream,
  gapLimit: defaultGapLimit,
  initialized: false,
  mnemonic: '',
  network: NetworkName.Testnet,
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
  loading: boolean
  reloading: boolean
  increaseIndex: () => void
  initialize: (wallet: Wallet) => void
  logout: () => void
  reloadWallet: (wallet: Wallet, gap?: number) => void
  resetWallet: () => void
  setMnemonic: (m: Mnemonic) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  loading: true,
  reloading: false,
  increaseIndex: () => {},
  initialize: () => {},
  logout: () => {},
  reloadWallet: () => {},
  resetWallet: () => {},
  setMnemonic: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { navigate } = useContext(NavigationContext)

  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
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

  const initialize = (wallet: Wallet) => {
    reloadWallet({ ...wallet, initialized: true })
    navigate(Pages.Wallet)
  }

  const logout = () => setMnemonic('')

  const reloadWallet = async (wallet: Wallet) => {
    if (reloading) return
    setReloading(true)
    const clone = { ...wallet }
    const { nextIndex, transactions, utxos } = await fetchHistory(wallet)
    console.log(
      'reload ended nextIndex, transactions.length, utxos.length',
      nextIndex,
      transactions.length,
      utxos.length,
    )
    clone.nextIndex[wallet.network] = nextIndex
    clone.transactions[wallet.network] = transactions
    clone.utxos[wallet.network] = utxos
    updateWallet(clone)
    setReloading(false)
  }

  const resetWallet = () => {
    updateWallet(defaultWallet)
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

  return (
    <WalletContext.Provider
      value={{
        loading,
        reloading,
        increaseIndex,
        initialize,
        logout,
        reloadWallet,
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
