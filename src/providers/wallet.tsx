import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, Transaction, XPubs } from '../lib/types'
import { ConfigContext } from './config'
import { getUtxos } from '../lib/utxo'
import { getTransactions } from '../lib/transactions'
import { selectCoins } from '../lib/coinSelection'

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
  feesToSendSats: (sats: number) => number
  increaseIndex: () => void
  logout: () => void
  reloadWallet: (wallet: Wallet, gap?: number) => void
  resetWallet: () => void
  sendSats: (sats: number, address: string) => string
  setMnemonic: (m: Mnemonic) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  loading: true,
  reloading: false,
  feesToSendSats: () => 0,
  increaseIndex: () => {},
  logout: () => {},
  reloadWallet: () => {},
  resetWallet: () => {},
  sendSats: () => '',
  setMnemonic: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)

  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [wallet, setWallet] = useState<Wallet>(defaultWallet)

  const mnemonic = useRef('')

  const setMnemonic = (m: Mnemonic) => {
    mnemonic.current = m
    setWallet({ ...wallet, mnemonic: m })
  }

  const increaseIndex = () => updateWallet({ ...wallet, nextIndex: wallet.nextIndex + 1 })

  const logout = () => setMnemonic('')

  const reloadWallet = async (wallet: Wallet, gap = 5) => {
    if (reloading) return
    setReloading(true)
    const utxos = await getUtxos(config, wallet, gap)
    const transactions = await getTransactions(config, wallet, gap)
    updateWallet({ ...wallet, transactions, utxos, nextIndex: 2 })
    setReloading(false)
  }

  const resetWallet = () => {
    updateWallet(defaultWallet)
    navigate(Pages.Init)
  }

  const feesToSendSats = (sats: number): number => {
    console.log('sats', sats)
    const inputs = selectCoins(sats, wallet.utxos)
    console.log('inputs.length', inputs.length)
    console.log('inputs', inputs)
    return 273 * inputs.length
  }

  const sendSats = (sats: number, address: string) => {
    console.log('sendSats', sats, address)
    return 'b29d036678113b2671a308496f06b1665d23ab16b5af8cd126cc8a2273353774' // TODO
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
        feesToSendSats,
        increaseIndex,
        logout,
        reloadWallet,
        resetWallet,
        sendSats,
        setMnemonic,
        updateWallet,
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
