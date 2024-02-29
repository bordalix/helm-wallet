import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import Textarea from '../../components/Textarea'
import { WalletContext } from '../../providers/wallet'

function Backup() {
  const { config, toggleShowConfig } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Backup' />
        <Subtitle text='Save your data' />
        <Textarea label='Mnemonic' value={wallet.mnemonic} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Backup
