import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import BarcodeScanner from '../../../components/BarcodeScanner'
import { decodeInvoice, isLnInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Input from '../../../components/Input'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import { isValidLnUrl } from '../../../lib/lnurl'
import * as bip21 from '../../../lib/bip21'
import { WalletContext } from '../../../providers/wallet'
import { NetworkName } from '../../../lib/network'

export default function SendInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const defaultLabel = 'Paste invoice or LNURL'
  const [buttonLabel, setButtonLabel] = useState(defaultLabel)
  const [error, setError] = useState('')
  const [mediaStream, setMediaStream] = useState(false)
  const [pasteAllowed, setPasteAllowed] = useState(true)
  const [pastedData, setPastedData] = useState('')

  const wrongNetwork = (invoice: string) =>
    (invoice.startsWith('lnbc') && wallet.network !== NetworkName.Liquid) ||
    (!invoice.startsWith('lnbc') && wallet.network === NetworkName.Liquid)

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setMediaStream(true)
          stream.getVideoTracks().forEach((track) => track.stop())
        })
        .catch((error) => console.error('Permission denied: ', error))
    } else {
      console.error('getUserMedia is not supported in this browser.')
    }
  })

  useEffect(() => {
    if (!pastedData) return
    const data = pastedData.toLowerCase()
    setError('')
    if (bip21.isBip21(data)) {
      const { address, amount, invoice, lnurl } = bip21.decode(data)
      if (address) {
        setSendInfo({ address: address, satoshis: amount })
        return navigate(amount ? Pages.SendDetails : Pages.SendAmount)
      }
      if (invoice) {
        if (wrongNetwork(invoice)) return setError('Invoice from wrong network')
        const decodedInvoice = decodeInvoice(invoice)
        if (decodedInvoice.magicHint && amount) decodedInvoice.satoshis = amount
        setSendInfo(decodedInvoice)
        return navigate(Pages.SendDetails)
      }
      if (lnurl) {
        setSendInfo({ lnurl: data })
        return navigate(Pages.SendAmount)
      }
      return setError('Unable to parse bip21')
    }
    if (isValidLnUrl(data)) {
      setSendInfo({ lnurl: data })
      return navigate(Pages.SendAmount)
    }
    if (isLnInvoice(data)) {
      try {
        if (wrongNetwork(data)) return setError('Invoice from wrong network')
        setSendInfo(decodeInvoice(data))
        return navigate(Pages.SendDetails)
      } catch (e) {
        console.error(e)
        setError('Invalid invoice')
      }
    } else {
      setSendInfo({ address: data })
      return navigate(Pages.SendAmount)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastedData])

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((data) => {
        setPastedData(data)
        setButtonLabel('Pasted')
        setTimeout(() => setButtonLabel(defaultLabel), 2000)
      })
      .catch((err) => {
        console.error('Failed to read clipboard contents: ', err)
        setPasteAllowed(false)
      })
  }

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setPastedData(e.target.value)

  return (
    <Container>
      <Content>
        <Title text='Send' subtext='Scan or paste invoice' />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          {error ? null : (
            <div className='flex flex-col h-full justify-between gap-10'>
              {!pasteAllowed ? <Input label='Paste your invoice here' left='&#9889;' onChange={handleChange} /> : null}
              {mediaStream ? (
                <BarcodeScanner setPastedData={setPastedData} setError={setError} />
              ) : (
                <p>Waiting for camera access</p>
              )}
            </div>
          )}
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePaste} label={buttonLabel} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
