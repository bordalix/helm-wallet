import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import { WalletContext } from '../../providers/wallet'
import InputPassword from '../../components/InputPassword'
import NewPassword from '../../components/NewPassword'
import OldPassword from '../../components/OldPassword'

function Password() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)

  const [locked, setLocked] = useState(true)
  const [password, setPassword] = useState('')

  const handleOldPassword = (e: any) => {
    if (e.target.value === config.password) setLocked(false)
  }

  const handleProceed = () => {
    updateConfig({ ...config, password })
    toggleShowConfig()
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Password' />
        <Subtitle text='Change your password' />
        {locked ? <OldPassword onOldPassword={handleOldPassword} /> : <NewPassword onNewPassword={setPassword} />}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label='Continue' disabled={!password} />
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Password
