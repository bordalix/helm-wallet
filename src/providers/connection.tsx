import { ReactNode, createContext, useState } from 'react'

interface ConnectionContextProps {
  offline: boolean
  setTor: (arg0: boolean) => void
  tor: boolean
}

export const ConnectionContext = createContext<ConnectionContextProps>({
  offline: false,
  setTor: () => {},
  tor: false,
})

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [tor, setTor] = useState(false)

  window.addEventListener('online', () => setOffline(false))
  window.addEventListener('offline', () => setOffline(true))

  return <ConnectionContext.Provider value={{ offline, setTor, tor }}>{children}</ConnectionContext.Provider>
}
