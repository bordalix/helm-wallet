import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Password from '../../components/Password'
import { NavigationContext, Pages } from '../../providers/navigation'
import { getXPubsAndBlindingKey } from '../../lib/liquid'
import { WalletContext } from '../../providers/wallet'

function InitPassword() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const { wallet, updateWallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)
  const [password, setPassword] = useState('')

  const handleProceed = () => {
    getXPubsAndBlindingKey(wallet).then(({ masterBlindingKey, xpubs }) => {
      updateConfig({ ...config, password })
      updateWallet({ ...wallet, masterBlindingKey, xpubs })
      navigate(Pages.Wallet)
    })
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Password' />
        <Subtitle text='Leave blank to reset password' />
        <div className='text-center px-8 mt-10'>
          <Password onChange={setPassword} />
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
        <Button onClick={handleProceed} label='Continue' />
      </ButtonsOnBottom>
    </div>
  )
}

export default InitPassword
