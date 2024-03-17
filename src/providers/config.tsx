import { ReactNode, createContext, useEffect, useState } from 'react'
import { clearStorage, readConfigFromStorage, saveConfigToStorage } from '../lib/storage'
import { ExplorerName } from '../lib/explorers'

export interface Config {
  explorer: ExplorerName
  gap: number
  notifications: boolean
  password: string
}

const defaultConfig: Config = {
  explorer: ExplorerName.Mempool,
  gap: 5,
  notifications: false,
  password: '',
}

interface ConfigContextProps {
  config: Config
  loading: boolean
  resetConfig: () => void
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (arg0: Config) => void
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
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  const toggleShowConfig = () => setShowConfig(!showConfig)

  const updateConfig = (data: Config) => {
    setConfig(data)
    saveConfigToStorage(data)
  }

  const resetConfig = () => {
    clearStorage()
    updateConfig(defaultConfig)
  }

  useEffect(() => {
    if (!loading) return
    const _config = readConfigFromStorage()
    updateConfig(_config ?? defaultConfig)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <ConfigContext.Provider value={{ config, loading, resetConfig, showConfig, toggleShowConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
