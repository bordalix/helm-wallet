import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { ConfigContext } from './config'
import { fetchURL } from '../lib/fetch'
import { Satoshis } from '../lib/types'
import Decimal from 'decimal.js'

export interface BoltzFees {
  minerFees: number
  percentage: number
}

const defaultBoltzFees: BoltzFees = {
  minerFees: 0,
  percentage: 0,
}

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
  calcFees: (sats: Satoshis, flow: string) => Satoshis
}

export const BoltzContext = createContext<BoltzContextProps>({
  error: '',
  limits: defaultBoltzLimits,
  calcFees: () => 0,
})

export const BoltzProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)

  const [error, setError] = useState('')
  const [limits, setLimits] = useState(defaultBoltzLimits)
  const [recvFees, setRecvFees] = useState(defaultBoltzFees)
  const [sendFees, setSendFees] = useState(defaultBoltzFees)

  const apiURL = config.network === 'testnet' ? 'https://testnet.boltz.exchange/api' : 'https://api.boltz.exchange'

  useEffect(() => {
    try {
      fetchURL(`${apiURL}/getpairs`).then((data) => {
        const pair = data.pairs['L-BTC/BTC']
        const limits: BoltzLimits = pair.limits
        setRecvFees({ minerFees: pair.fees.minerFees.quoteAsset.normal, percentage: pair.fees.percentage })
        setSendFees({ minerFees: pair.fees.minerFees.baseAsset.normal, percentage: pair.fees.percentageSwapIn })
        setLimits(limits)
      })
    } catch (error) {
      setError(error as string)
    }
  }, [config.network])

  const calcFees = (satoshis: Satoshis, flow = 'send'): Satoshis => {
    const fees = flow === 'send' ? sendFees : recvFees
    return Decimal.mul(satoshis, fees.percentage).div(100).add(fees.minerFees).toNumber()
  }

  return <BoltzContext.Provider value={{ calcFees, error, limits }}>{children}</BoltzContext.Provider>
}
