import { useContext, useEffect } from 'react'
import Init from './screens/Init/Init'
import Wallet from './screens/Wallet/Index'
import Header from './components/Header'
import Footer from './components/Footer'
import Settings from './screens/Settings/Index'
import Loading from './components/Loading'
import SendInvoice from './screens/Wallet/Send/Invoice'
import SendDetails from './screens/Wallet/Send/Details'
import SendPayment from './screens/Wallet/Send/Pay'
import ReceiveAmount from './screens/Wallet/Receive/Amount'
import ReceiveInvoice from './screens/Wallet/Receive/Invoice'
import InitNew from './screens/Init/New'
import InitOld from './screens/Init/Restore'
import SendFees from './screens/Wallet/Send/Fees'
import ReceiveSuccess from './screens/Wallet/Receive/Success'
import { ConfigContext } from './providers/config'
import { NavigationContext, Pages } from './providers/navigation'
import InitPassword from './screens/Init/Password'
import OuterContainer from './components/OuterContainer'
import ReceiveFees from './screens/Wallet/Receive/Fees'
import SendSuccess from './screens/Wallet/Send/Success'
import Transactions from './screens/Wallet/Transactions'
import SendAmount from './screens/Wallet/Send/Amount'
import { WalletContext } from './providers/wallet'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import Toast, { toastNewVersionAvailable } from './components/Toast'

export default function App() {
  const { loadingConfig, showConfig } = useContext(ConfigContext)
  const { screen } = useContext(NavigationContext)
  const { loadingWallet } = useContext(WalletContext)

  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: () => {
        toastNewVersionAvailable()
      },
    })
  }, [])

  useEffect(() => {
    setInterval(() => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) registration.update()
      })
    }, 1000 * 60 * 60)
  }, [])

  if (loadingConfig || loadingWallet) return <Loading />
  if (showConfig) return <Settings />

  return (
    <OuterContainer>
      <Toast />
      <Header />
      <div className='grow'>
        {screen === Pages.Init && <Init />}
        {screen === Pages.InitNew && <InitNew />}
        {screen === Pages.InitOld && <InitOld />}
        {screen === Pages.InitPassword && <InitPassword />}
        {screen === Pages.ReceiveAmount && <ReceiveAmount />}
        {screen === Pages.ReceiveFees && <ReceiveFees />}
        {screen === Pages.ReceiveInvoice && <ReceiveInvoice />}
        {screen === Pages.ReceiveSuccess && <ReceiveSuccess />}
        {screen === Pages.SendAmount && <SendAmount />}
        {screen === Pages.SendInvoice && <SendInvoice />}
        {screen === Pages.SendDetails && <SendDetails />}
        {screen === Pages.SendFees && <SendFees />}
        {screen === Pages.SendPayment && <SendPayment />}
        {screen === Pages.SendSuccess && <SendSuccess />}
        {screen === Pages.Transactions && <Transactions />}
        {screen === Pages.Wallet && <Wallet />}
      </div>
      <Footer />
    </OuterContainer>
  )
}
