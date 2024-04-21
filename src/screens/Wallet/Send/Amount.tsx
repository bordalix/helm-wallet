import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Title from '../../../components/Title'
import Content from '../../../components/Content'
import InputAmount from '../../../components/InputAmount'
import { BoltzContext } from '../../../providers/boltz'
import Container from '../../../components/Container'
import { prettyNumber } from '../../../lib/format'
import { fetchLnUrl } from '../../../lib/lnurl'
import Error from '../../../components/Error'
import { extractError } from '../../../lib/error'
import { decodeInvoice } from '../../../lib/lightning'

enum ButtonLabel {
  Low = 'Amount too low',
  High = 'Amount too high',
  Nok = 'Something went wrong',
  Ok = 'Continue',
}

export default function SendAmount() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { limits } = useContext(BoltzContext)

  const [amount, setAmount] = useState(0)
  const [error, setError] = useState('')

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = async () => {
    if (!sendInfo.lnurl) return
    try {
      const invoice = await fetchLnUrl(sendInfo.lnurl, amount)
      setSendInfo(decodeInvoice(invoice))
      navigate(Pages.SendDetails)
    } catch (err: any) {
      if (err.status === 404) setError(`Not found ${sendInfo.lnurl}`)
      else setError(extractError(err))
    }
  }

  const { minimal, maximal } = limits
  const disabled = amount < minimal || amount > maximal || Boolean(error)
  const label = error
    ? ButtonLabel.Nok
    : amount < limits.minimal
    ? ButtonLabel.Low
    : amount > limits.maximal
    ? ButtonLabel.High
    : ButtonLabel.Ok

  return (
    <Container>
      <Content>
        <Title text='Send' subtext={`Min: ${prettyNumber(minimal)} · Max: ${prettyNumber(maximal)} sats`} />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          <InputAmount label='Amount' onChange={setAmount} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
