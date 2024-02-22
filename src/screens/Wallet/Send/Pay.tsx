import { useContext } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Subtitle from '../../../components/Subtitle'
import Title from '../../../components/Title'

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
      <Content>
        <Title text='Pay' />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        <Button onClick={handleSuccess} label='Success' />
      </ButtonsOnBottom>
    </div>
  )
}

export default SendPay
