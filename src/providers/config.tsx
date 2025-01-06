import { ReactNode, createContext, useEffect, useState } from 'react'
import { readConfigFromStorage, saveConfigToStorage } from '../lib/storage'
import { Unit } from '../lib/units'

export enum Themes {
  Dark = 'Dark',
  Light = 'Light',
}

export interface Config {
  notifications: boolean
  pos: boolean
  theme: Themes
  tor: boolean
  unit: Unit
}

const defaultConfig: Config = {
  notifications: false,
  pos: false,
  theme: Themes.Light,
  tor: false,
  unit: Unit.BTC,
}

interface ConfigContextProps {
  config: Config
  loadingConfig: boolean
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (c: Config) => void
}

export const ConfigContext = createContext<ConfigContextProps>({
  config: defaultConfig,
  loadingConfig: true,
  showConfig: false,
  toggleShowConfig: () => {},
  updateConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [loadingConfig, setLoadingConfig] = useState(true)
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
    if (!loadingConfig) return
    const config = readConfigFromStorage() ?? { ...defaultConfig, theme: preferredTheme() }
    updateConfig(config)
    setLoadingConfig(false)
  }, [loadingConfig])

  return (
    <ConfigContext.Provider value={{ config, loadingConfig, showConfig, toggleShowConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
