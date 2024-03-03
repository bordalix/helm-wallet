import { useContext } from 'react'
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

const App = () => {
  const { loading, showConfig } = useContext(ConfigContext)
  const { screen } = useContext(NavigationContext)

  if (loading) return <Loading />
  if (showConfig) return <Settings />

  return (
    <OuterContainer>
      <Header />
      <div className='grow'>
        {screen === Pages.Init && <Init />}
        {screen === Pages.InitNew && <InitNew />}
        {screen === Pages.InitOld && <InitOld />}
        {screen === Pages.InitPassword && <InitPassword />}
        {screen === Pages.Wallet && <Wallet />}
        {screen === Pages.SendInvoice && <SendInvoice />}
        {screen === Pages.SendDetails && <SendDetails />}
        {screen === Pages.SendPayment && <SendPayment />}
        {screen === Pages.SendFees && <SendFees />}
        {screen === Pages.ReceiveAmount && <ReceiveAmount />}
        {screen === Pages.ReceiveInvoice && <ReceiveInvoice />}
        {screen === Pages.ReceiveSuccess && <ReceiveSuccess />}
      </div>
      <Footer />
    </OuterContainer>
  )
}

export default App
