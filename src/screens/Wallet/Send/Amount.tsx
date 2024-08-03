import { useContext, useEffect, useState } from 'react'
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
import { checkLnUrlConditions, fetchLnUrl } from '../../../lib/lnurl'
import Error from '../../../components/Error'
import { extractError } from '../../../lib/error'
import { decodeInvoice } from '../../../lib/lightning'
import { WalletContext } from '../../../providers/wallet'
import { getBalance } from '../../../lib/wallet'
import InputComment from '../../../components/InputComment'

enum ButtonLabel {
  High = 'Amount too high',
  Low = 'Amount too low',
  Nok = 'Something went wrong',
  Ok = 'Continue',
  Poor = 'Insufficient funds',
}

export default function SendAmount() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { limits } = useContext(BoltzContext)
  const { wallet } = useContext(WalletContext)

  const [amount, setAmount] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [showNote, setShowNote] = useState(false)

  const balance = getBalance(wallet)
  const { minimal, maximal } = limits // Boltz limit

  const [commentAllowed, setCommentAllowed] = useState(0)
  const [maxSendable, setMaxSendable] = useState(minimal)
  const [minSendable, setMinSendable] = useState(maximal)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = async () => {
    if (!sendInfo.lnurl && !sendInfo.address) return
    if (sendInfo.address) {
      setSendInfo({ ...sendInfo, comment, satoshis: amount })
      navigate(Pages.SendDetails)
    }
    if (sendInfo.lnurl) {
      try {
        const invoice = await fetchLnUrl(sendInfo.lnurl, amount, comment)
        setSendInfo({ ...decodeInvoice(invoice), comment })
        navigate(Pages.SendDetails)
      } catch (err: any) {
        if (err.status === 404) setError(`Not found ${sendInfo.lnurl}`)
        else setError(extractError(err))
      }
    }
  }

  useEffect(() => {
    if (!sendInfo.lnurl) return
    checkLnUrlConditions(sendInfo.lnurl)
      .then((conditions) => {
        setCommentAllowed(conditions.commentAllowed ?? 10)
        setMaxSendable(conditions.maxSendable > maximal ? maximal : conditions.maxSendable)
        setMinSendable(conditions.minSendable < minimal ? minimal : conditions.minSendable)
      })
      .catch(() => {})
  }, [])

  const label =
    amount > balance
      ? ButtonLabel.Poor
      : error
      ? ButtonLabel.Nok
      : amount < limits.minimal
      ? ButtonLabel.Low
      : amount > limits.maximal
      ? ButtonLabel.High
      : ButtonLabel.Ok

  const disabled = label !== ButtonLabel.Ok
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints // TODO

  return (
    <Container>
      <Content>
        <Title text='Send' subtext={`Min: ${prettyNumber(minSendable)} · Max: ${prettyNumber(maxSendable)} sats`} />
        <Error error={Boolean(error)} text={error} />
        {!showNote ? <InputAmount onChange={setAmount} /> : null}
        {commentAllowed && (!isMobile || showNote) ? <InputComment onChange={setComment} max={commentAllowed} /> : null}
        {commentAllowed && isMobile && showNote ? <p onClick={() => setShowNote(false)}>Back to amount</p> : null}
        {commentAllowed && isMobile && !showNote ? <p onClick={() => setShowNote(true)}>Add optional note</p> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
