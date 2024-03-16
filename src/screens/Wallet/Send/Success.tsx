import { useContext } from 'react'
import Button from '../../../components/Button'
import SuccessIcon from '../../../icons/Success'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'
import { getTxIdURL } from '../../../lib/explorers'
import { ConfigContext } from '../../../providers/config'
import { FlowContext } from '../../../providers/flow'

function SendSuccess() {
  const { config } = useContext(ConfigContext)
  const { sendInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)

  const handleExplorer = () => {
    console.log('click')
    if (!sendInfo.txid) return
    window.open(getTxIdURL(sendInfo.txid, config), '_blank', 'noreferrer')
  }

  const goBackToWallet = () => navigate(Pages.Wallet)

  return (
    <Container>
      <Content>
        <Title text='Success' subtext='Payment sent' />
        <div className='flex h-60'>
          <div className='m-auto'>
            <SuccessIcon />
          </div>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleExplorer} label='View on explorer' />
        <Button onClick={goBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default SendSuccess
