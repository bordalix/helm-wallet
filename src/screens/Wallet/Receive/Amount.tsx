import { useContext, useState } from 'react'
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
import InputComment from '../../../components/InputComment'

enum ButtonLabel {
  Low = 'Amount too low',
  High = 'Amount too high',
  Ok = 'Continue',
}

export default function ReceiveAmount() {
  const { navigate } = useContext(NavigationContext)
  const { setRecvInfo } = useContext(FlowContext)
  const { limits } = useContext(BoltzContext)

  const [amount, setAmount] = useState(0)
  const [comment, setComment] = useState('')
  const [showNote, setShowNote] = useState(false)

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = () => {
    setRecvInfo({ amount, comment, total: 0 })
    navigate(Pages.ReceiveFees)
  }

  const { minimal, maximal } = limits
  const disabled = amount < minimal || amount > maximal
  const label = amount < limits.minimal ? ButtonLabel.Low : amount > limits.maximal ? ButtonLabel.High : ButtonLabel.Ok
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints // TODO

  return (
    <Container>
      <Content>
        <Title text='Receive' subtext={`Min: ${prettyNumber(minimal)} · Max: ${prettyNumber(maximal)} sats`} />
        {!showNote ? <InputAmount onChange={setAmount} /> : null}
        {!isMobile || showNote ? <InputComment onChange={setComment} max={120} subtext /> : null}
        {isMobile && showNote ? <p onClick={() => setShowNote(false)}>Back to amount</p> : null}
        {isMobile && !showNote ? <p onClick={() => setShowNote(true)}>Add optional note</p> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
