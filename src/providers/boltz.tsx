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
  const { config } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)

  const [error, setError] = useState('')
  const [limits, setLimits] = useState(defaultBoltzLimits)
  const [recvFees, setRecvFees] = useState(defaultBoltzFees)
  const [sendFees, setSendFees] = useState(defaultBoltzFees)

  useEffect(() => {
    try {
      fetchURL(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/submarine`).then((data) => {
        const { limits, fees } = data['L-BTC'].BTC
        const { minerFees, percentage } = fees
        setSendFees({ minerFees, percentage })
        setLimits(limits)
      })
      fetchURL(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse`).then((data) => {
        const { minerFees, percentage } = data.BTC['L-BTC'].fees
        setRecvFees({ minerFees: minerFees.claim + minerFees.lockup, percentage })
      })
    } catch (error) {
      setError(error as string)
    }
  }, [wallet.network])

  const expectedFees = (amount: Satoshis, flow = 'send'): { boltzFees: Satoshis; minerFees: Satoshis } => {
    const fees = flow === 'send' ? sendFees : recvFees
    return {
      boltzFees: Decimal.ceil(Decimal.mul(amount, fees.percentage).div(100)).toNumber(),
      minerFees: fees.minerFees,
    }
  }

  const maxAmount = (wallet: Wallet) => {
    const balance = getBalance(wallet)
    const txFees = feeForCoins(wallet.utxos[wallet.network].length, wallet.network)
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
