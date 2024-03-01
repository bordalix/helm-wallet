import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { readWallet, saveWallet } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { NetworkName } from '../lib/network'
import { Mnemonic, XPubs } from '../lib/types'
import { ConfigContext } from './config'
import { getUtxos } from '../lib/utxo'
import { getXPubs } from '../lib/derivation'
import Modal from '../components/Modal'
import NeedsPassword from '../components/NeedsPassword'

export interface Wallet {
  network: NetworkName
  nextIndex: number
  mnemonic: Mnemonic
  utxos: any[]
  xpubs: XPubs
}

interface WalletContextProps {
  loading: boolean
  reloading: boolean
  reloadUtxos: (arg0: Wallet, gap?: number) => void
  resetWallet: () => void
  setShowModal: (arg0: boolean) => void
  updateWallet: (arg0: Wallet) => void
  wallet: Wallet
}

const defaultWallet: Wallet = {
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
  loading: true,
  reloading: false,
  reloadUtxos: () => {},
  resetWallet: () => {},
  setShowModal: () => {},
  updateWallet: () => {},
  wallet: defaultWallet,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [reloading, setReloading] = useState(false)
  const [wallet, setWallet] = useState<Wallet>(defaultWallet)

  const updateWallet = (data: Wallet) => {
    setWallet(data)
    saveWallet(data)
  }

  const resetWallet = () => {
    updateWallet(defaultWallet)
    navigate(Pages.Init)
  }

  const reloadUtxos = async (wallet: Wallet, gap = 20) => {
    if (reloading) return
    setReloading(true)
    if (!wallet.xpubs.testnet) wallet.xpubs = await getXPubs(wallet)
    const utxos = await getUtxos(config, wallet, gap)
    updateWallet({ ...wallet, utxos })
    setReloading(false)
  }

  const closeDialog = () => setShowModal(false)

  const handlePassword = (pass: string) => {
    setPassword(pass)
    closeDialog()
  }

  useEffect(() => {
    if (!loading) return
    readWallet().then((wallet: Wallet | undefined) => {
      setLoading(false)
      if (!wallet) return navigate(Pages.Init)
      setWallet(wallet)
      navigate(wallet.mnemonic ? Pages.Wallet : Pages.Init)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <WalletContext.Provider
      value={{ loading, reloading, reloadUtxos, resetWallet, setShowModal, updateWallet, wallet }}
    >
      <>
        <Modal open={showModal} onClose={closeDialog}>
          <NeedsPassword setPassword={handlePassword} />
        </Modal>
        {children}
      </>
    </WalletContext.Provider>
  )
}
