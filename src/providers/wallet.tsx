import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { readWallet, saveWallet } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, XPubs } from '../lib/types'
import { ConfigContext } from './config'
import { fetchUnspents } from '../lib/utxo'
import { unblindUnspents } from '../lib/blinder'

export interface Wallet {
  masterBlindingKey: string
  network: NetworkName
  nextIndex: number
  mnemonic: Mnemonic
  utxos: any[]
  xpubs: XPubs
}

interface WalletContextProps {
  loading: boolean
  resetWallet: () => void
  updateWallet: (arg0: Wallet) => void
  wallet: Wallet
}

const defaultWallet: Wallet = {
  masterBlindingKey: '',
  network: NetworkName.Testnet,
  nextIndex: 1,
  mnemonic: '',
  utxos: [],
  xpubs: {
    [NetworkName.Liquid]: '',
    [NetworkName.Regtest]: '',
    [NetworkName.Testnet]: '',
  },
}

export const WalletContext = createContext<WalletContextProps>({
  wallet: defaultWallet,
  loading: true,
  resetWallet: () => {},
  updateWallet: () => {},
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)

  const [wallet, setWallet] = useState<Wallet>(defaultWallet)
  const [loading, setLoading] = useState(true)

  const updateWallet = (data: Wallet) => {
    setWallet(data)
    saveWallet(data)
  }

  const resetWallet = () => {
    updateWallet(defaultWallet)
    navigate(Pages.Init)
  }

  useEffect(() => {
    if (!loading) return
    readWallet().then((wallet: Wallet | undefined) => {
      setLoading(false)
      if (!wallet) return navigate(Pages.Init)
      if (wallet.utxos.length === 0) {
        fetchUnspents(config, wallet).then((blindedUtxos) => {
          // unblindUnspents(blindedUtxos).then((utxos) => updateWallet({ ...wallet, utxos }))
          updateWallet({ ...wallet, utxos: blindedUtxos })
        })
      } else {
        setWallet(wallet)
      }
      navigate(wallet.mnemonic ? Pages.Wallet : Pages.Init)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <WalletContext.Provider value={{ loading, resetWallet, updateWallet, wallet }}>{children}</WalletContext.Provider>
  )
}
