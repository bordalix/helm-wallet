import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import BarcodeScanner from '../../../components/BarcodeScanner'
import { decodeInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Input from '../../../components/Input'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import { pasteFromClipboard } from '../../../lib/clipboard'
import { isValidLnUrl } from '../../../lib/lnurl'

export default function SendInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)

  const defaultLabel = 'Paste invoice or LNURL'
  const [buttonLabel, setButtonLabel] = useState(defaultLabel)
  const [cameraAllowed, setCameraAllowed] = useState(false)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState('')

  // Firefox doesn't support navigator.clipboard.readText()
  const firefox = !navigator.clipboard || !('readText' in navigator.clipboard)

  useEffect(() => {
    navigator.permissions.query({ name: 'camera' as PermissionName }).then((x) => {
      if (x.state !== 'denied') setCameraAllowed(true)
    })
  })

  useEffect(() => {
    if (!invoice) return
    if (isValidLnUrl(invoice)) {
      setSendInfo({ lnurl: invoice })
      navigate(Pages.SendAmount)
    } else {
      setError('')
      try {
        setSendInfo(decodeInvoice(invoice))
        navigate(Pages.SendDetails)
      } catch (e) {
        console.error(e)
        setError('Invalid invoice')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice])

  const handlePaste = async () => {
    const invoice = await pasteFromClipboard()
    setButtonLabel('Pasted')
    setTimeout(() => setButtonLabel(defaultLabel), 2000)
    setInvoice(invoice)
  }

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setInvoice(e.target.value)

  return (
    <Container>
      <Content>
        <Title text='Send' subtext={`${firefox ? 'Paste' : 'Scan or paste'} invoice`} />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          {error ? null : (
            <div className='flex flex-col h-full justify-between'>
              {firefox ? (
                <Input label='Paste your invoice here' left='&#9889;' onChange={handleChange} />
              ) : cameraAllowed ? (
                <BarcodeScanner setInvoice={setInvoice} setError={setError} />
              ) : null}
            </div>
          )}
        </div>
      </Content>
      <ButtonsOnBottom>
        {!firefox && <Button onClick={handlePaste} label={buttonLabel} />}
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
