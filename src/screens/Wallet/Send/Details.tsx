import { useContext } from 'react'
import Button from '../../../components/Button'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import InvoiceDetails from '../../../components/InvoiceDetails'
import { getBalance } from '../../../lib/wallet'
import { WalletContext } from '../../../providers/wallet'
import { decodeInvoice } from '../../../lib/lightning'

export default function SendDetails() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const handleContinue = () => navigate(Pages.SendFees)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const { satoshis } = decodeInvoice(sendInfo.invoice)
  const lowBalance = getBalance(wallet) < satoshis
  const label = lowBalance ? 'Insufficient funds' : 'Continue'

  return (
    <Container>
      <Content>
        <Title text='Invoice details' />
        <InvoiceDetails invoice={sendInfo.invoice} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleContinue} label={label} disabled={lowBalance} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
