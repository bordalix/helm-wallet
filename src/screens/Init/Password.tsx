import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { NavigationContext, Pages } from '../../providers/navigation'
import { getXPubs } from '../../lib/derivation'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'
import NewPassword from '../../components/NewPassword'

function InitPassword() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const { wallet, updateWallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)

  const [password, setPassword] = useState('')

  const handleProceed = () => {
    getXPubs(wallet).then((xpubs) => {
      updateConfig({ ...config, password })
      updateWallet({ ...wallet, xpubs })
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
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
        <Button onClick={handleProceed} label='Continue' disabled={!password} />
      </ButtonsOnBottom>
    </div>
  )
}

export default InitPassword
