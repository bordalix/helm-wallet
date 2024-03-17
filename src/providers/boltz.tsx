import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { fetchURL } from '../lib/fetch'
import { Satoshis } from '../lib/types'
import Decimal from 'decimal.js'
import { getBoltzApiUrl } from '../lib/boltz'
import { WalletContext } from './wallet'

export interface ExpectedFees {
  boltzFees: Satoshis
  minerFees: Satoshis
}

const defaultExpectedFees = {
  boltzFees: 0,
  minerFees: 0,
}

export interface BoltzFees {
  minerFees: Satoshis
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
  expectedFees: (sats: Satoshis, flow: string) => ExpectedFees
}

export const BoltzContext = createContext<BoltzContextProps>({
  error: '',
  limits: defaultBoltzLimits,
  expectedFees: () => defaultExpectedFees,
})

export const BoltzProvider = ({ children }: { children: ReactNode }) => {
  const { wallet } = useContext(WalletContext)

  const [error, setError] = useState('')
  const [limits, setLimits] = useState(defaultBoltzLimits)
  const [recvFees, setRecvFees] = useState(defaultBoltzFees)
  const [sendFees, setSendFees] = useState(defaultBoltzFees)

  useEffect(() => {
    try {
      fetchURL(`${getBoltzApiUrl(wallet.network)}/v2/swap/submarine`).then((data) => {
        const { limits, fees } = data['L-BTC'].BTC
        const { minerFees, percentage } = fees
        setSendFees({ minerFees, percentage })
        setLimits(limits)
      })
      fetchURL(`${getBoltzApiUrl(wallet.network)}/v2/swap/reverse`).then((data) => {
        const { minerFees, percentage } = data.BTC['L-BTC'].fees
        setRecvFees({ minerFees: minerFees.claim + minerFees.lockup, percentage })
      })
    } catch (error) {
      setError(error as string)
    }
  }, [wallet.network])

  const expectedFees = (satoshis: Satoshis, flow = 'send'): { boltzFees: Satoshis; minerFees: Satoshis } => {
    const fees = flow === 'send' ? sendFees : recvFees
    return {
      boltzFees: Decimal.ceil(Decimal.mul(satoshis, fees.percentage).div(100)).toNumber(),
      minerFees: fees.minerFees,
    }
  }

  return <BoltzContext.Provider value={{ expectedFees, error, limits }}>{children}</BoltzContext.Provider>
}
