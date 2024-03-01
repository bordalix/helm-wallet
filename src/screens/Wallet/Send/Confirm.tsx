import { useContext } from 'react'
import Button from '../../../components/Button'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import InvoiceDetails from '../../../components/InvoiceDetails'

function SendConfirm() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)

  const handlePay = () => navigate(Pages.SendPayment)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  return (
    <Container>
      <Content>
        <Title text='Payment details' />
        <InvoiceDetails />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePay} label='Pay' />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default SendConfirm
