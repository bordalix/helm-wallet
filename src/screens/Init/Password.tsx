import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { NavigationContext, Pages } from '../../providers/navigation'
import { getMasterKeys } from '../../lib/wallet'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'
import NewPassword from '../../components/NewPassword'
import { saveMnemonicToStorage } from '../../lib/storage'
import { FlowContext } from '../../providers/flow'
import { ConfigContext } from '../../providers/config'
import Container from '../../components/Container'

export default function InitPassword() {
  const { navigate } = useContext(NavigationContext)
  const { config, updateConfig } = useContext(ConfigContext)
  const { wallet, initialize } = useContext(WalletContext)
  const { initInfo } = useContext(FlowContext)

  const [label, setLabel] = useState('')
  const [password, setPassword] = useState('')

  const handleCancel = () => navigate(Pages.Init)

  const handleProceed = () => {
    const { mnemonic } = initInfo
    saveMnemonicToStorage(mnemonic, password)
    getMasterKeys(mnemonic).then(({ masterBlindingKey, xpubs }) => {
      updateConfig(config)
      initialize({ ...wallet, masterBlindingKey, xpubs })
    })
  }

  return (
    <Container>
      <Content>
        <Title text='Password' subtext='Define your password' />
        <div className='mt-10'>
          <NewPassword onNewPassword={setPassword} setLabel={setLabel} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={!password} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
