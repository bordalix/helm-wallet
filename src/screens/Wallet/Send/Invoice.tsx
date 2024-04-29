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
import { pasteFromClipboard } from '../../../lib/clipboard'
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
  const [cameraAllowed, setCameraAllowed] = useState(false)
  const [error, setError] = useState('')
  const [pastedData, setPastedData] = useState('')

  // Firefox doesn't support navigator.clipboard.readText()
  const firefox = !navigator.clipboard || !('readText' in navigator.clipboard)

  const wrongNetwork = (invoice: string) =>
    (invoice.startsWith('lnbc') && wallet.network !== NetworkName.Liquid) ||
    (!invoice.startsWith('lnbc') && wallet.network === NetworkName.Liquid)

  useEffect(() => {
    if (firefox) return
    navigator.permissions.query({ name: 'camera' as PermissionName }).then((x) => {
      if (x.state !== 'denied') setCameraAllowed(true)
    })
  })

  useEffect(() => {
    if (!pastedData) return
    setError('')
    if (bip21.isBip21(pastedData)) {
      const { address, amount, invoice, lnurl } = bip21.decode(pastedData)
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
        setSendInfo({ lnurl: pastedData })
        return navigate(Pages.SendAmount)
      }
      return setError('Unable to parse bip21')
    }
    if (isValidLnUrl(pastedData)) {
      setSendInfo({ lnurl: pastedData })
      return navigate(Pages.SendAmount)
    }
    if (isLnInvoice(pastedData)) {
      try {
        if (wrongNetwork(pastedData)) return setError('Invoice from wrong network')
        setSendInfo(decodeInvoice(pastedData))
        return navigate(Pages.SendDetails)
      } catch (e) {
        console.error(e)
        setError('Invalid invoice')
      }
    } else {
      setSendInfo({ address: pastedData })
      return navigate(Pages.SendAmount)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastedData])

  const handlePaste = async () => {
    let data = await pasteFromClipboard()
    setButtonLabel('Pasted')
    setTimeout(() => setButtonLabel(defaultLabel), 2000)
    setPastedData(data)
  }

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setPastedData(e.target.value)

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
                <BarcodeScanner setPastedData={setPastedData} setError={setError} />
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
