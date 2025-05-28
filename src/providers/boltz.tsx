import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { fetchURL } from '../lib/fetch'
import { Satoshis } from '../lib/types'
import Decimal from 'decimal.js'
import { getBoltzApiUrl } from '../lib/boltz'
import { Wallet, WalletContext } from './wallet'
import { getBalance } from '../lib/wallet'
import { feeForCoins } from '../lib/fees'
import { ConfigContext } from './config'

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

interface BoltzLimitsReverse {
  maximal: number
  minimal: number
}

interface BoltzLimitsSubmarine {
  maximal: number
  minimal: number
  maximalZeroConf: number
}

export interface BoltzLimits {
  recv: BoltzLimitsReverse
  send: BoltzLimitsSubmarine
}

const defaultBoltzLimits: BoltzLimits = {
  recv: {
    maximal: 25_000_000,
    minimal: 100,
  },
  send: {
    maximal: 25_000_000,
    minimal: 1_000,
    maximalZeroConf: 250_000,
  },
}

interface BoltzContextProps {
  error: string
  limits: BoltzLimits
  expectedFees: (sats: Satoshis, flow?: string) => ExpectedFees
  maxAllowedAmount: (w: Wallet) => number
  maxLiquidAmount: (w: Wallet) => number
}

export const BoltzContext = createContext<BoltzContextProps>({
  error: '',
  limits: defaultBoltzLimits,
  expectedFees: () => defaultExpectedFees,
  maxAllowedAmount: () => 0,
  maxLiquidAmount: () => 0,
})

export const BoltzProvider = ({ children }: { children: ReactNode }) => {
  const { config, loadingConfig } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)

  const [error, setError] = useState('')
  const [limits, setLimits] = useState<BoltzLimits>(defaultBoltzLimits)
  const [recvFees, setRecvFees] = useState(defaultBoltzFees)
  const [sendFees, setSendFees] = useState(defaultBoltzFees)

  // fetch limits and fees from Boltz API
  // wait for config to load, to know if user is using Tor
  useEffect(() => {
    if (loadingConfig) return
    try {
      fetchURL(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/submarine`).then((data) => {
        const { limits, fees } = data['L-BTC'].BTC
        const { minerFees, percentage } = fees
        setSendFees({ minerFees, percentage })
        setLimits((l) => ({ ...l, send: limits }))
      })
      fetchURL(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse`).then((data) => {
        const { limits, fees } = data.BTC['L-BTC']
        const { minerFees, percentage } = fees
        setRecvFees({ minerFees: minerFees.claim + minerFees.lockup, percentage })
        setLimits((l) => ({ ...l, recv: limits }))
      })
    } catch (error) {
      setError(error as string)
    }
  }, [wallet.network, loadingConfig])

  const expectedFees = (amount: Satoshis, flow = 'send'): { boltzFees: Satoshis; minerFees: Satoshis } => {
    const fees = flow === 'send' ? sendFees : recvFees
    return {
      boltzFees: Decimal.ceil(Decimal.mul(amount, fees.percentage).div(100)).toNumber(),
      minerFees: fees.minerFees,
    }
  }

  const maxAmount = (wallet: Wallet) => {
    const balance = getBalance(wallet)
    const txFees = feeForCoins(wallet.utxos[wallet.network].length)
    const { boltzFees, minerFees } = expectedFees(balance - txFees)
    return { balance, txFees, boltzFees, minerFees }
  }

  const maxAllowedAmount = (wallet: Wallet): number => {
    const { balance, txFees, boltzFees, minerFees } = maxAmount(wallet)
    return balance - txFees - boltzFees - minerFees
  }

  const maxLiquidAmount = (wallet: Wallet): number => {
    const { balance, txFees } = maxAmount(wallet)
    return balance - txFees
  }

  return (
    <BoltzContext.Provider value={{ expectedFees, maxAllowedAmount, maxLiquidAmount, error, limits }}>
      {children}
    </BoltzContext.Provider>
  )
}
