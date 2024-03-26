import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveMnemonicToStorage, saveWalletToStorage } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, NextIndexes, Transactions, Utxos, XPubs } from '../lib/types'
import { fetchHistory, fetchHistoryWS } from '../lib/fetch'
import { ExplorerName } from '../lib/explorers'
import { defaultExplorer, defaultGapLimit, defaultNetwork } from '../lib/constants'
import { ChainSource, WsElectrumChainSource } from '../lib/chainsource'

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
  explorer: defaultExplorer,
  gapLimit: defaultGapLimit,
  initialized: false,
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
  increaseIndex: () => void
  logout: () => void
  reloadWallet: (w?: Wallet) => void
  resetWallet: () => void
  setMnemonic: (m: Mnemonic) => void
  updateWallet: (w: Wallet) => void
  wallet: Wallet
}

export const WalletContext = createContext<WalletContextProps>({
  chainSource: new WsElectrumChainSource(defaultNetwork),
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
  const { navigate } = useContext(NavigationContext)

  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [wallet, setWallet] = useState(defaultWallet)
  const [chainSource, setChainSource] = useState<ChainSource>(new WsElectrumChainSource(defaultNetwork))

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
    fetchHistoryWS(chainSource, wallet)
    const { nextIndex, transactions, utxos } = await fetchHistory(clone)
    clone.nextIndex[wallet.network] = nextIndex
    clone.transactions[wallet.network] = transactions
    clone.utxos[wallet.network] = utxos
    updateWallet(clone)
    setReloading(false)
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
          setChainSource(new WsElectrumChainSource(wallet.network))
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
