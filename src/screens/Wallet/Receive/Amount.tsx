import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptyRecvInfo } from '../../../providers/flow'
import Title from '../../../components/Title'
import Content from '../../../components/Content'
import InputAmount from '../../../components/InputAmount'
import { BoltzContext } from '../../../providers/boltz'
import Container from '../../../components/Container'
import { prettyNumber } from '../../../lib/format'

enum ButtonLabel {
  Low = 'Amount too low',
  High = 'Amount too high',
  Ok = 'Generate invoice',
}

function ReceiveAmount() {
  const { navigate } = useContext(NavigationContext)
  const { setRecvInfo } = useContext(FlowContext)
  const { limits } = useContext(BoltzContext)

  const [amount, setAmount] = useState(0)
  const [label, setLabel] = useState(ButtonLabel.Low)

  useEffect(() => {
    if (amount < limits.minimal) return setLabel(ButtonLabel.Low)
    if (amount > limits.maximal) return setLabel(ButtonLabel.High)
    setLabel(ButtonLabel.Ok)
  }, [amount])

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = () => {
    setRecvInfo({ amount })
    navigate(Pages.ReceiveInvoice)
  }

  const { minimal, maximal } = limits
  const disabled = amount < minimal || amount > maximal

  return (
    <Container>
      <Content>
        <Title text='Receive' subtext={`Max: ${prettyNumber(maximal)} Min: ${prettyNumber(minimal)} sats`} />
        <InputAmount label='Amount' onChange={setAmount} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default ReceiveAmount
