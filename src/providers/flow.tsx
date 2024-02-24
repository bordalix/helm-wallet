import { ReactNode, createContext, useState } from 'react'

export interface RecvInfo {
  amount: number
}

export interface SendInfo {
  satoshis: number
  note: string
  invoice: string
}

interface FlowContextProps {
  recvInfo: RecvInfo
  sendInfo: SendInfo
  setRecvInfo: (arg0: RecvInfo) => void
  setSendInfo: (arg0: SendInfo) => void
}

export const emptyRecvInfo: RecvInfo = {
  amount: 0,
}

export const emptySendInfo: SendInfo = {
  satoshis: 0,
  note: '',
  invoice: '',
}

export const FlowContext = createContext<FlowContextProps>({
  recvInfo: emptyRecvInfo,
  sendInfo: emptySendInfo,
  setRecvInfo: () => {},
  setSendInfo: () => {},
})

export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const [recvInfo, setRecvInfo] = useState(emptyRecvInfo)
  const [sendInfo, setSendInfo] = useState(emptySendInfo)

  return (
    <FlowContext.Provider value={{ recvInfo, sendInfo, setRecvInfo, setSendInfo }}>{children}</FlowContext.Provider>
  )
}
