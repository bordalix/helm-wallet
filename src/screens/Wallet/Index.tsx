import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import { balance } from '../../lib/utxo'
import Container from '../../components/Container'
import Content from '../../components/Content'

function Wallet() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { setShowModal, wallet } = useContext(WalletContext)

  const debug = () => {
    console.log('config', config)
    console.log('wallet', wallet)
    setShowModal(true)
  }

  return (
    <Container>
      <Content>
        <Balance value={balance(wallet)} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.SendInvoice)} label='Send' />
        <Button onClick={() => navigate(Pages.ReceiveAmount)} label='Receive' />
        <Button onClick={debug} label='Debug' />
      </ButtonsOnBottom>
    </Container>
  )
}

export default Wallet
