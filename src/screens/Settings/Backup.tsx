import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import Textarea from '../../components/Textarea'
import Container from '../../components/Container'
import NeedsPassword from '../../components/NeedsPassword'
import { WalletContext } from '../../providers/wallet'

export default function Backup() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { setMnemonic, wallet } = useContext(WalletContext)

  const handleClose = () => {
    toggleShowConfig()
  }

  return (
    <Container>
      <Content>
        <Title text='Backup' subtext='Save your data' />
        <Textarea label='Mnemonic' value={wallet.mnemonic} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Save backup file' />
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? null : <NeedsPassword onClose={handleClose} onMnemonic={setMnemonic} />}
    </Container>
  )
}
