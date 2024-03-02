import { useContext } from 'react'
import Button from '../../../components/Button'
import SuccessIcon from '../../../icons/Success'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'

function ReceiveSuccess() {
  const { navigate } = useContext(NavigationContext)

  const handleBackToWallet = () => navigate(Pages.Wallet)

  return (
    <Container>
      <Content>
        <Title text='Success' subtext='Payment received' />
        <div className='flex h-60'>
          <div className='m-auto'>
            <SuccessIcon />
          </div>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleBackToWallet} label='Back to wallet' />
      </ButtonsOnBottom>
    </Container>
  )
}

export default ReceiveSuccess
