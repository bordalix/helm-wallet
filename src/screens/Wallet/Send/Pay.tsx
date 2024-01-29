import { useContext } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'

function SendPay() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)

  const handleSuccess = () => navigate(Pages.SendSuccess)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <div className='mt-8'>
          <p>Pay</p>
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        <Button onClick={handleSuccess} label='Success' />
      </ButtonsOnBottom>
    </div>
  )
}

export default SendPay
