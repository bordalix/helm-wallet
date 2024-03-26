import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Title from '../../../components/Title'
import Content from '../../../components/Content'
import InputAmount from '../../../components/InputAmount'
import Container from '../../../components/Container'

export default function SendAmount() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const [amount, setAmount] = useState(0)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = () => {
    setSendInfo({ ...sendInfo, total: amount })
    navigate(Pages.SendPayment)
  }

  return (
    <Container>
      <Content>
        <Title text='Send' subtext='Define amount to send' />
        <InputAmount label='Amount' onChange={setAmount} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label='Continue' disabled={!amount} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
