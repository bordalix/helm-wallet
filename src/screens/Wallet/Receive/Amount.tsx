import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext } from '../../../providers/flow'
import Title from '../../../components/Title'
import Subtitle from '../../../components/Subtitle'
import Content from '../../../components/Content'
import InputAmount from '../../../components/InputAmount'
import { BoltzContext } from '../../../providers/boltz'

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

  const handleProceed = () => {
    setRecvInfo({ amount })
    navigate(Pages.ReceiveInvoice)
  }

  const disabled = amount < limits.minimal || amount > limits.maximal

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Receive' />
        <Subtitle text={`Max: ${limits.maximal} Min: ${limits.minimal} sats`} />
        <InputAmount label='Amount' onChange={setAmount} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
      </ButtonsOnBottom>
    </div>
  )
}

export default ReceiveAmount
