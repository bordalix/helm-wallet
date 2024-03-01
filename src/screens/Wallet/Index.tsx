import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'
import { balance } from '../../lib/utxo'
import Container from '../../components/Container'
import Content from '../../components/Content'

function Wallet() {
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  return (
    <Container>
      <Content>
        <Balance value={balance(wallet)} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.SendInvoice)} label='Send' />
        <Button onClick={() => navigate(Pages.ReceiveAmount)} label='Receive' />
      </ButtonsOnBottom>
    </Container>
  )
}

export default Wallet
