import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { readConfig, saveConfig } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { ExplorerName } from '../lib/explorers'
import { NetworkName } from '../lib/networks'
import { Mnemonic } from '../lib/types'

export interface Config {
  explorer: string
  network: NetworkName
  mnemonic: Mnemonic
  notifications: boolean
  password: string
}

interface ConfigContextProps {
  config: Config
  loading: boolean
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (arg0: Config) => void
}

const defaultConfig: Config = {
  explorer: ExplorerName.Mempool,
  network: NetworkName.Liquid,
  mnemonic: '',
  notifications: false,
  password: '',
}

export const ConfigContext = createContext<ConfigContextProps>({
  config: defaultConfig,
  loading: true,
  showConfig: false,
  toggleShowConfig: () => {},
  updateConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { navigate } = useContext(NavigationContext)

  const [config, setConfig] = useState<Config>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  const toggleShowConfig = () => setShowConfig(!showConfig)

  const updateConfig = (data: Config) => {
    if (data.network === NetworkName.Regtest) {
      data.explorer = ExplorerName.Nigiri
    } else if (data.explorer === ExplorerName.Nigiri) {
      data.explorer = ExplorerName.Mempool
    }
    setConfig(data)
    saveConfig(data)
    // if user logout, send him to initial screen
    if (!data.mnemonic) navigate(Pages.Init)
  }

  useEffect(() => {
    if (!loading) return
    readConfig().then((data) => {
      setLoading(false)
      if (data) setConfig(data)
      navigate(data?.mnemonic ? Pages.Wallet : Pages.Init)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <ConfigContext.Provider value={{ config, loading, showConfig, toggleShowConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
