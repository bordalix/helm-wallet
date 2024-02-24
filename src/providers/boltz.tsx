import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { ConfigContext } from './config'
import { fetchURL } from '../lib/fetch'

export interface BoltzLimits {
  maximal: number
  minimal: number
}

const defaultBoltzLimits: BoltzLimits = {
  maximal: 25_000_000,
  minimal: 1_000,
}

interface BoltzContextProps {
  error: string
  limits: BoltzLimits
}

export const BoltzContext = createContext<BoltzContextProps>({
  error: '',
  limits: defaultBoltzLimits,
})

export const BoltzProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)

  const [error, setError] = useState('')
  const [limits, setLimits] = useState(defaultBoltzLimits)

  const apiURL = `${config.network === 'testnet' ? 'testnet.' : ''}boltz.exchange/api`

  useEffect(() => {
    try {
      fetchURL(`${apiURL}/getpairs`).then((data) => {
        const limits: BoltzLimits = data.pairs['L-BTC/BTC'].limits
        setLimits(limits)
      })
    } catch (error) {
      setError(error as string)
    }
  }, [config.network])

  return <BoltzContext.Provider value={{ error, limits }}>{children}</BoltzContext.Provider>
}
