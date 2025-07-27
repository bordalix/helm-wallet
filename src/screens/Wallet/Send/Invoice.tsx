import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import { decodeInvoice, isLnInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import { checkLnUrlConditions, isValidLnUrl } from '../../../lib/lnurl'
import * as bip21 from '../../../lib/bip21'
import { WalletContext } from '../../../providers/wallet'
import { NetworkName } from '../../../lib/network'
import { isLiquidAddress } from '../../../lib/liquid'
import InputDestination from '../../../components/InputDestination'

export default function SendInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const defaultLabel = 'Paste invoice or LNURL'

  const [buttonLabel, setButtonLabel] = useState(defaultLabel)
  const [error, setError] = useState('')
  const [pastedData, setPastedData] = useState('')
  const [text, setText] = useState('')

  const wrongNetwork = (invoice: string) =>
    (invoice.startsWith('lnbc') && wallet.network !== NetworkName.Liquid) ||
    (!invoice.startsWith('lnbc') && wallet.network === NetworkName.Liquid)

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
      checkLnUrlConditions(data)
        .then(() => {
          setSendInfo({ lnurl: data })
          return navigate(Pages.SendAmount)
        })
        .catch((err) => {
          console.error(err)
          setError('Invalid LNURL')
        })
      return
    }
    if (isLnInvoice(data)) {
      try {
        if (wrongNetwork(data)) return setError('Invoice from wrong network')
        if (!decodeInvoice(data).satoshis) return setError('Invoices without amount are not supported')
        setSendInfo(decodeInvoice(data))
        return navigate(Pages.SendDetails)
      } catch (e) {
        console.error(e)
        setError('Invalid invoice')
      }
    }
    if (isLiquidAddress(data, wallet.network)) {
      setSendInfo({ address: data })
      return navigate(Pages.SendAmount)
    } else {
      return setError('Invalid data')
    }
  }, [pastedData])

  const handleChange = (data: string) => {
    setError('')
    setButtonLabel(data ? 'Continue' : defaultLabel)
    setText(data)
  }

  const handlePaste = () => {
    if (text) return setPastedData(text)
    navigator.clipboard
      .readText()
      .then((data) => {
        setPastedData(data)
        setButtonLabel('Pasted')
        setTimeout(() => setButtonLabel(defaultLabel), 2100)
      })
      .catch((err) => {
        console.error('Failed to read clipboard contents: ', err)
      })
  }

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  return (
    <Container>
      <Content>
        <Title text='Send' subtext='Scan or paste invoice' />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          <InputDestination onChange={handleChange} onError={setError} onScan={setPastedData} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePaste} label={buttonLabel} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
