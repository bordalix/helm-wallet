import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, Transaction, XPubs } from '../lib/types'
import { ConfigContext } from './config'
import { fetchHistory } from '../lib/fetch'

export interface Wallet {
  initialized: boolean
  masterBlindingKey?: string
  mnemonic: Mnemonic
  network: NetworkName
  nextIndex: number
  transactions: Transaction[]
  utxos: any[]
  xpubs: XPubs
}

const defaultWallet: Wallet = {
  initialized: false,
  mnemonic: '',
  network: NetworkName.Testnet,
  nextIndex: 1,
  transactions: [],
  utxos: [],
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
  logout: () => {},
  reloadWallet: () => {},
  resetWallet: () => {},
  setMnemonic: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)
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
    console.log('increase index to', wallet.nextIndex + 1)
    const _wallet = { ...wallet, nextIndex: wallet.nextIndex + 1 }
    saveWalletToStorage(_wallet)
    setWallet(_wallet)
  }

  const logout = () => setMnemonic('')

  const reloadWallet = async (wallet: Wallet, gap = 5) => {
    if (reloading) return
    setReloading(true)
    const { transactions, utxos } = await fetchHistory(config, wallet, gap)
    updateWallet({ ...wallet, transactions, utxos })
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
    const wallet = readWalletFromStorage()
    setLoading(false)
    if (!wallet) return navigate(Pages.Init)
    setWallet(wallet)
    navigate(Pages.Wallet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <WalletContext.Provider
      value={{
        loading,
        reloading,
        increaseIndex,
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
