import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import { isLnInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import { isValidLnUrl } from '../../../lib/lnurl'
import * as bip21 from '../../../lib/bip21'
import { WalletContext } from '../../../providers/wallet'
import { isLiquidAddress } from '../../../lib/liquid'
import InputDestination from '../../../components/InputDestination'

export default function SendLiquid() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const defaultLabel = 'Paste Liquid address'

  const [buttonLabel, setButtonLabel] = useState(defaultLabel)
  const [pastedData, setPastedData] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pastedData) return
    const data = pastedData.toLowerCase().replace(/^lightning:/, '')
    setError('')
    if (bip21.isBip21(data)) {
      const { address, amount, invoice, lnurl } = bip21.decode(data)
      if (address) {
        setSendInfo({ address: address, satoshis: amount })
        return navigate(amount ? Pages.SendDetails : Pages.SendAmount)
      }
      if (invoice) {
        return setError("Can't pay lightning invoices")
      }
      if (lnurl) {
        return setError("Can't pay lnurl invoices")
      }
      return setError('Unable to parse bip21')
    }
    if (isValidLnUrl(data)) {
      return setError("Can't pay lnurl invoices")
    }
    if (isLnInvoice(data)) {
      return setError("Can't pay lightning invoices")
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
    setPastedData(data)
    setButtonLabel(data ? 'Continue' : defaultLabel)
  }

  const handlePaste = () => {
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
        <Title text='Send' subtext='Lightning is unavailable' />
        <div className='flex flex-col gap-2'>
          <Error text={error} />
          <InputDestination onChange={handleChange} onError={setError} onScan={setPastedData} label='Liquid address' />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePaste} label={buttonLabel} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
