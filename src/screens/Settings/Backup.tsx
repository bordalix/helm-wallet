import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import Textarea from '../../components/Textarea'
import Container from '../../components/Container'
import NeedsPassword from '../../components/NeedsPassword'
import { WalletContext } from '../../providers/wallet'
import { copyToClipboard } from '../../lib/clipboard'

export default function Backup() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { setMnemonic, wallet } = useContext(WalletContext)

  const label = 'Copy to clipboard'
  const [buttonLabel, setButtonLabel] = useState(label)

  const handleClose = () => {
    toggleShowConfig()
  }

  const handleCopy = async () => {
    await copyToClipboard(wallet.mnemonic)
    setButtonLabel('Copied')
    setTimeout(() => setButtonLabel(label), 2000)
  }

  return (
    <Container>
      <Content>
        <Title text='Backup' subtext='Save your data' />
        <Textarea label='Mnemonic' value={wallet.mnemonic} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCopy} label={buttonLabel} />
        <Button onClick={handleClose} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? null : <NeedsPassword onClose={handleClose} onMnemonic={setMnemonic} />}
    </Container>
  )
}
