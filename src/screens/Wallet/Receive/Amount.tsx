import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext } from '../../../providers/flow'
import Title from '../../../components/Title'
import Subtitle from '../../../components/Subtitle'

function ReceiveAmount() {
  const { navigate } = useContext(NavigationContext)
  const { setRecvInfo } = useContext(FlowContext)

  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')

  const handleProceed = () => {
    setRecvInfo({ amount, note })
    navigate(Pages.ReceiveInvoice)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='w-full mx-auto'>
        <Title text='Receive' />
        <Subtitle text='Define amount and optional note' />
        <fieldset className='text-left text-gray-800 mt-10'>
          <div className='flex justify-between mb-2'>
            <label htmlFor='url' className='block font-medium'>
              Amount
            </label>
            <label htmlFor='toggle' className='inline-flex items-center space-x-4 text-sm cursor-pointer'>
              <span>Sats</span>
              <span className='relative'>
                <input id='toggle' type='checkbox' className='hidden peer' />
                <div className='w-10 h-4 rounded-full shadow bg-gray-200' />
                <div className='absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto bg-gray-800' />
              </span>
              <span>BTC</span>
            </label>
          </div>
          <input
            id='amount'
            type='text'
            name='amount'
            placeholder='0'
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className='w-full border pr-2 py-2 text-right rounded-md border-gray-800 text-gray-800 bg-gray-100'
          />
        </fieldset>
        <fieldset className='text-left mt-8'>
          <label htmlFor='url' className='block font-medium mb-2'>
            Note
          </label>
          <input
            id='url'
            name='url'
            type='text'
            onChange={(e) => setNote(e.target.value)}
            className='w-full border pl-2 py-2 rounded-md border-gray-800 text-gray-800 bg-gray-100'
          />
        </fieldset>
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label='Generate invoice' />
      </ButtonsOnBottom>
    </div>
  )
}

export default ReceiveAmount
