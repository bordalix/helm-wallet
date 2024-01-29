import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import BarcodeScanner from '../../../components/BarcodeScanner'
import { decodeInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Input from '../../../components/Input'

function SendInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)

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
      setSendInfo(decodeInvoice(data))
      navigate(Pages.SendConfirm)
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
    <div className='flex flex-col h-full justify-between'>
      <div className='grow'>
        {error ? (
          <div className='mt-8'>
            <Error error={error} />
          </div>
        ) : (
          <div className='flex flex-col h-full justify-between'>
            <BarcodeScanner setData={setData} setError={setError} />
            {firefox ? <Input label='Paste your invoice here' left='&#9889;' onChange={handleChange} /> : null}
          </div>
        )}
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        {!firefox && <Button onClick={handlePaste} label={buttonLabel} />}
      </ButtonsOnBottom>
    </div>
  )
}

export default SendInvoice
