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
import { unitLabels, Unit } from '../../../lib/units'
import { isMobile } from '../../../lib/window'

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

  const [sats, setSats] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [showNote, setShowNote] = useState(false)

  const balance = getBalance(wallet)
  const { minimal, maximal } = limits // Boltz limit

  const [commentAllowed, setCommentAllowed] = useState(0)
  const [maxSendable, setMaxSendable] = useState(maximal)
  const [minSendable, setMinSendable] = useState(minimal)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleProceed = async () => {
    if (!sendInfo.lnurl && !sendInfo.address) return
    if (sendInfo.address) {
      setSendInfo({ ...sendInfo, comment, satoshis: sats })
      navigate(Pages.SendDetails)
    }
    if (sendInfo.lnurl) {
      try {
        const invoice = await fetchLnUrl(sendInfo.lnurl, sats, comment)
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
        const max = Math.floor(conditions.maxSendable / 1000) // from millisatoshis to satoshis
        const min = Math.floor(conditions.minSendable / 1000) // from millisatoshis to satoshis
        setCommentAllowed(conditions.commentAllowed ?? 0)
        setMaxSendable(max > maximal ? maximal : max)
        setMinSendable(min < minimal ? minimal : min)
      })
      .catch(() => {})
  }, [])

  const label =
    sats > balance
      ? ButtonLabel.Poor
      : error
      ? ButtonLabel.Nok
      : sats < minSendable
      ? ButtonLabel.Low
      : sats > maxSendable
      ? ButtonLabel.High
      : ButtonLabel.Ok

  const disabled = label !== ButtonLabel.Ok

  return (
    <Container>
      <Content>
        <Title
          text='Send'
          subtext={`Min: ${prettyNumber(minSendable)} · Max: ${prettyNumber(maxSendable)} ${unitLabels[Unit.SAT]}`}
        />
        <Error error={Boolean(error)} text={error} />
        {!showNote ? <InputAmount balance={balance} sats={sats} setSats={setSats} /> : null}
        {commentAllowed && (!isMobile || showNote) ? (
          <InputComment comment={comment} setComment={setComment} max={commentAllowed} />
        ) : null}
        {commentAllowed && isMobile && showNote ? (
          <Button onClick={() => setShowNote(false)} label='Back to amount' clean />
        ) : null}
        {commentAllowed && isMobile && !showNote ? (
          <Button onClick={() => setShowNote(true)} label='Add optional note' clean />
        ) : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
