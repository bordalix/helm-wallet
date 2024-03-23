import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'
import { getBalance } from '../../lib/wallet'
import Container from '../../components/Container'
import Content from '../../components/Content'
import QRCodeIcon from '../../icons/QRCode'
import ScanIcon from '../../icons/Scan'
import Transactions from '../../components/Transactions'
import { BoltzContext } from '../../providers/boltz'

export default function Wallet() {
  const { limits, maxAllowedAmount } = useContext(BoltzContext)
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  const canSend = maxAllowedAmount(wallet) > limits.minimal

  return (
    <Container>
      <Content>
        <Balance value={getBalance(wallet)} />
        <Transactions short />
      </Content>
      <ButtonsOnBottom>
        <Button icon={<ScanIcon />} label='Send' onClick={() => navigate(Pages.SendInvoice)} disabled={!canSend} />
        <Button icon={<QRCodeIcon />} label='Receive' onClick={() => navigate(Pages.ReceiveAmount)} />
      </ButtonsOnBottom>
    </Container>
  )
}
