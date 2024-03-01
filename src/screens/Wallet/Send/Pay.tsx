import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import NeedsPassword from '../../../components/NeedsPassword'
import Subtitle from '../../../components/Subtitle'
import LoadingIcon from '../../../icons/Loading'

function SendPay() {
  const { navigate } = useContext(NavigationContext)
  const { setSendInfo } = useContext(FlowContext)

  const [status, setStatus] = useState('Waiting for password...')

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleMnemonic = (mnemonic: string) => {
    console.log(mnemonic)
    setStatus('Preparing transaction')
    setTimeout(() => setStatus('Broadcasting transaction'), 3_000)
    setTimeout(() => navigate(Pages.SendSuccess), 6_000)
  }

  return (
    <Container>
      <Content>
        <Title text='Pay' />
        <Subtitle text={status} />
        <center>
          <LoadingIcon />
        </center>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
      <NeedsPassword onClose={handleCancel} onMnemonic={handleMnemonic} />
    </Container>
  )
}

export default SendPay
