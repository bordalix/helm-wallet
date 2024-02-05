import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { clearStorage, readConfig, saveConfig } from '../lib/storage'
import { NavigationContext, Pages } from './navigation'
import { ExplorerName } from '../lib/explorers'
import { NetworkName } from '../lib/network'
import { Mnemonic, XPubs } from '../lib/types'

export interface Config {
  explorer: ExplorerName
  network: NetworkName
  notifications: boolean
  password: string
}

interface ConfigContextProps {
  config: Config
  loading: boolean
  resetConfig: () => void
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (arg0: Config) => void
}

const defaultConfig: Config = {
  explorer: ExplorerName.Mempool,
  network: NetworkName.Testnet,
  notifications: false,
  password: '',
}

export const ConfigContext = createContext<ConfigContextProps>({
  config: defaultConfig,
  loading: true,
  resetConfig: () => {},
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
  }

  const resetConfig = () => {
    clearStorage()
    updateConfig(defaultConfig)
  }

  useEffect(() => {
    if (!loading) return
    readConfig().then((data) => {
      setLoading(false)
      if (data) setConfig(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <ConfigContext.Provider value={{ config, loading, resetConfig, showConfig, toggleShowConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
