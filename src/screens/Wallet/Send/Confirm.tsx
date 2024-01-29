import { useContext } from 'react'
import Button from '../../../components/Button'
import { formatInvoice } from '../../../lib/format'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'

const Item = ({ title, body }: any) => {
  return (
    <div className='mb-8'>
      <p className='font-bold'>{title}</p>
      <p className=''>{body}</p>
    </div>
  )
}

function SendConfirm() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const handlePay = () => navigate(Pages.SendPayment)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <div className='mt-8'>
          <Item title='Satoshis' body={sendInfo.satoshis} />
          <Item title='Note' body={sendInfo.note} />
          <Item title='Invoice' body={formatInvoice(sendInfo.invoice)} />
          <Item title='Boltz fees' body='148 sats' />
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        <Button onClick={handlePay} label='Pay' />
      </ButtonsOnBottom>
    </div>
  )
}

export default SendConfirm
