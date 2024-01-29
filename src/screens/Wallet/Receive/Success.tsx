import { useContext } from 'react'
import Button from '../../../components/Button'
import SuccessIcon from '../../../icons/Success'
import Title from '../../../components/Title'
import Subtitle from '../../../components/Subtitle'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'

function ReceiveSuccess() {
  const { navigate } = useContext(NavigationContext)

  const handleBackToWallet = () => navigate(Pages.Wallet)

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Success' />
        <Subtitle text='Payment received' />
        <div className='flex h-60'>
          <div className='m-auto'>
            <SuccessIcon />
          </div>
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleBackToWallet} label='Back to wallet' />
      </ButtonsOnBottom>
    </div>
  )
}

export default ReceiveSuccess
