import { useContext } from 'react'
import Button from '../../../components/Button'
import SuccessIcon from '../../../icons/Success'
import Title from '../../../components/Title'
import Subtitle from '../../../components/Subtitle'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'

function SendSuccess() {
  const { navigate } = useContext(NavigationContext)

  const handleBackToWallet = () => navigate(Pages.Wallet)

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Success' />
        <Subtitle text='Payment sent' />
        <div className='flex h-60'>
          <div className='m-auto'>
            <SuccessIcon />
          </div>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleBackToWallet} label='Back to wallet' />
      </ButtonsOnBottom>
    </div>
  )
}

export default SendSuccess
