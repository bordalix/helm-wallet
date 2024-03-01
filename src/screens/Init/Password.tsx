import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { NavigationContext, Pages } from '../../providers/navigation'
import { getXPubs } from '../../lib/derivation'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'
import NewPassword from '../../components/NewPassword'
import { saveMnemonic } from '../../lib/storage'
import { FlowContext } from '../../providers/flow'
import { ConfigContext } from '../../providers/config'

function InitPassword() {
  const { navigate } = useContext(NavigationContext)
  const { config, updateConfig } = useContext(ConfigContext)
  const { wallet, updateWallet } = useContext(WalletContext)
  const { initInfo } = useContext(FlowContext)

  const [password, setPassword] = useState('')

  const handleCancel = () => navigate(Pages.Init)

  const handleProceed = () => {
    const { mnemonic } = initInfo
    saveMnemonic(mnemonic, password)
    getXPubs(mnemonic).then((xpubs) => {
      updateConfig(config)
      updateWallet({ ...wallet, initialized: true, xpubs })
      navigate(Pages.Wallet)
    })
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Password' />
        <Subtitle text='Leave blank to reset password' />
        <NewPassword onNewPassword={setPassword} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label='Continue' disabled={!password} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default InitPassword
