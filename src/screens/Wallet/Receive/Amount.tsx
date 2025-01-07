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
import { unitLabels, Unit } from '../../../lib/units'

enum ButtonLabel {
  Low = 'Amount too low',
  High = 'Amount too high',
  Ok = 'Continue',
}

export default function ReceiveAmount() {
  const { navigate } = useContext(NavigationContext)
  const { setRecvInfo } = useContext(FlowContext)
  const { limits } = useContext(BoltzContext)

  const [sats, setSats] = useState(0)
  const [comment, setComment] = useState('')
  const [showNote, setShowNote] = useState(false)

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = () => {
    setRecvInfo({ amount: sats, comment, total: 0 })
    navigate(Pages.ReceiveFees)
  }

  const { minimal, maximal } = limits
  const disabled = sats < minimal || sats > maximal
  const label = sats < limits.minimal ? ButtonLabel.Low : sats > limits.maximal ? ButtonLabel.High : ButtonLabel.Ok
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints // TODO

  return (
    <Container>
      <Content>
        <Title
          text='Receive'
          subtext={`Min: ${prettyNumber(minimal)} · Max: ${prettyNumber(maximal)} ${unitLabels[Unit.SAT]}`}
        />
        {!showNote ? <InputAmount sats={sats} setSats={setSats} /> : null}
        {!isMobile || showNote ? <InputComment comment={comment} setComment={setComment} max={120} subtext /> : null}
        {isMobile && showNote ? <Button onClick={() => setShowNote(false)} label='Back to amount' clean /> : null}
        {isMobile && !showNote ? <Button onClick={() => setShowNote(true)} label='Add optional note' clean /> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
