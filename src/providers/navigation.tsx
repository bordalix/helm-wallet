import { ReactNode, createContext, useState } from 'react'

export enum Pages {
  Init,
  InitNew,
  InitOld,
  InitPassword,
  Wallet,
  SendInvoice,
  SendDetails,
  SendFees,
  SendPayment,
  SendSuccess,
  ReceiveAmount,
  ReceiveFees,
  ReceiveInvoice,
  ReceiveSuccess,
}

interface NavigationContextProps {
  screen: Pages
  navigate: (arg0: Pages) => void
}

export const NavigationContext = createContext<NavigationContextProps>({
  screen: Pages.Init,
  navigate: () => {},
})

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState(Pages.Init)
  const navigate = setScreen
  return <NavigationContext.Provider value={{ screen, navigate }}>{children}</NavigationContext.Provider>
}
