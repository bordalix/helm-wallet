import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'
import { balance } from '../../lib/utxo'
import Container from '../../components/Container'
import Content from '../../components/Content'
import QRCodeIcon from '../../icons/QRCode'
import ScanIcon from '../../icons/Scan'

function Wallet() {
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  return (
    <Container>
      <Content>
        <div className='mt-24'>
          <Balance value={balance(wallet)} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button icon={<ScanIcon />} label='Send' onClick={() => navigate(Pages.SendInvoice)} />
        <Button icon={<QRCodeIcon />} label='Receive' onClick={() => navigate(Pages.ReceiveAmount)} />
      </ButtonsOnBottom>
    </Container>
  )
}

export default Wallet
