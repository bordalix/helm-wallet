import { ReactNode, createContext, useEffect, useState } from 'react'
import { readConfigFromStorage, saveConfigToStorage } from '../lib/storage'

export enum Themes {
  Dark = 'Dark',
  Light = 'Light',
}

export enum Unit {
  BTC = 'btc',
  EUR = 'eur',
  USD = 'usd',
}

export interface Config {
  notifications: boolean
  theme: Themes
  tor: boolean
  unit: Unit
}

const defaultConfig: Config = {
  notifications: false,
  theme: Themes.Light,
  tor: false,
  unit: Unit.BTC,
}

interface ConfigContextProps {
  config: Config
  loading: boolean
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (c: Config) => void
}

export const ConfigContext = createContext<ConfigContextProps>({
  config: defaultConfig,
  loading: true,
  showConfig: false,
  toggleShowConfig: () => {},
  updateConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  const toggleShowConfig = () => setShowConfig(!showConfig)

  const preferredTheme = () =>
    window?.matchMedia?.('(prefers-color-scheme: dark)').matches ? Themes.Dark : Themes.Light

  const updateConfig = (data: Config) => {
    setConfig(data)
    updateTheme(data)
    saveConfigToStorage(data)
  }

  const updateTheme = ({ theme }: Config) => {
    if (theme === Themes.Dark) document.body.classList.add('dark')
    else document.body.classList.remove('dark')
  }

  useEffect(() => {
    if (!loading) return
    const config = readConfigFromStorage() ?? { ...defaultConfig, theme: preferredTheme() }
    updateConfig(config)
    setLoading(false)
  }, [loading])

  return (
    <ConfigContext.Provider value={{ config, loading, showConfig, toggleShowConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
