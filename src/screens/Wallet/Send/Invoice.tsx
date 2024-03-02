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
import { BoltzContext } from '../../../providers/boltz'

function SendInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)
  const { calcFees } = useContext(BoltzContext)

  const defaultLabel = 'Paste invoice'
  const [buttonLabel, setButtonLabel] = useState(defaultLabel)
  const [error, setError] = useState('')
  const [data, setData] = useState('')

  // Firefox doesn't support navigator.clipboard.readText()
  const firefox = !('readText' in navigator.clipboard)

  useEffect(() => {
    if (!data) return
    if (data.match(/^LNURL/)) {
      return setError('LNURL not supported, please add amount to invoice')
    }
    setError('')
    try {
      const decoded = decodeInvoice(data)
      const boltzFees = calcFees(decoded.satoshis, 'send')
      const txFees = 200
      const total = decoded.satoshis + boltzFees + txFees
      setSendInfo({ ...decoded, boltzFees, total, txFees })
      navigate(Pages.SendDetails)
    } catch (e) {
      setError('Invalid invoice')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handlePaste = () => {
    navigator.clipboard.readText().then((data): void => {
      setButtonLabel('Pasted')
      setTimeout(() => setButtonLabel(defaultLabel), 2000)
      setData(data)
    })
  }

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleChange = (e: any) => setData(e.target.value)

  return (
    <Container>
      <Content>
        <Title text='Send' subtext='Scan or paste invoice' />
        {error ? (
          <Error error={error} />
        ) : (
          <div className='flex flex-col h-full justify-between'>
            {/* <BarcodeScanner setData={setData} setError={setError} /> */}
            {firefox ? <Input label='Paste your invoice here' left='&#9889;' onChange={handleChange} /> : null}
          </div>
        )}
      </Content>
      <ButtonsOnBottom>
        {!firefox && <Button onClick={handlePaste} label={buttonLabel} />}
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default SendInvoice
