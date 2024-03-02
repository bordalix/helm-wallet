import { ReactNode, createContext, useState } from 'react'

export interface InitInfo {
  mnemonic: string
}

export interface RecvInfo {
  amount: number
}

export interface SendInfo {
  boltzFees: number
  invoice: string
  note: string
  satoshis: number
  total: number
  txFees: number
}

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
  boltzFees: 0,
  invoice: '',
  note: '',
  satoshis: 0,
  total: 0,
  txFees: 0,
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
