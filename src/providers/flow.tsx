import { ReactNode, createContext, useState } from 'react'
import { Invoice } from '../lib/lightning'
import { ECPairInterface } from 'ecpair'
import { SubmarineSwapResponse } from '../lib/submarineSwap'
import { ReverseSwapResponse } from '../lib/reverseSwap'

export interface InitInfo {
  mnemonic: string
}

export interface RecvInfo {
  amount: number
  swapResponse?: ReverseSwapResponse
  txid?: string
}

export type SendInfoLightning = Invoice & {
  lnurl?: string
  keys?: ECPairInterface
  swapResponse?: SubmarineSwapResponse
  total?: number
  txFees?: number
  txid?: string
}

export type SendInfoLiquid = {
  address?: string
  keys?: ECPairInterface
  total?: number
  txFees?: number
  txid?: string
}

export type SendInfo = SendInfoLightning & SendInfoLiquid

interface FlowContextProps {
  initInfo: InitInfo
  recvInfo: RecvInfo
  sendInfo: SendInfo
  setInitInfo: (arg0: InitInfo) => void
  setRecvInfo: (arg0: RecvInfo) => void
  setSendInfo: (arg0: SendInfo) => void
}

export const emptyInitInfo: InitInfo = {
  mnemonic: '',
}

export const emptyRecvInfo: RecvInfo = {
  amount: 0,
}

export const emptySendInfo: SendInfo = {
  invoice: '',
  note: '',
  paymentHash: '',
  satoshis: 0,
}

export const FlowContext = createContext<FlowContextProps>({
  initInfo: emptyInitInfo,
  recvInfo: emptyRecvInfo,
  sendInfo: emptySendInfo,
  setInitInfo: () => {},
  setRecvInfo: () => {},
  setSendInfo: () => {},
})

export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const [initInfo, setInitInfo] = useState(emptyInitInfo)
  const [recvInfo, setRecvInfo] = useState(emptyRecvInfo)
  const [sendInfo, setSendInfo] = useState(emptySendInfo)

  return (
    <FlowContext.Provider value={{ initInfo, recvInfo, sendInfo, setInitInfo, setRecvInfo, setSendInfo }}>
      {children}
    </FlowContext.Provider>
  )
}
