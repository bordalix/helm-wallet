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
import InputPassword from '../../components/InputPassword'

const calcStrength = (pass: string, max = 100): number => {
  let strength = pass.length * 5
  if (pass.match(/\d/)) strength += 10
  if (pass.match(/\W/)) strength += 10
  return strength < max ? strength : max
}

enum ButtonLabel {
  Bad = 'Passwords not equal',
  Ok = 'Continue',
}

function InitPassword() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const { wallet, updateWallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)

  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState(0)

  const handleChangeInsert = (e: any) => {
    const pass = e.target.value
    setStrength(calcStrength(pass))
    setPassword(pass)
  }

  const handleChangeConfirm = (e: any) => setConfirm(e.target.value)

  const handleProceed = () => {
    getXPubs(wallet).then((xpubs) => {
      updateConfig({ ...config, password })
      updateWallet({ ...wallet, xpubs })
      navigate(Pages.Wallet)
    })
  }

  const disabled = password !== confirm
  const label = disabled ? ButtonLabel.Bad : ButtonLabel.Ok

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Password' />
        <Subtitle text='Leave blank to reset password' />
        <div className='pt-10'>
          <InputPassword onChange={handleChangeInsert} label='Insert password' />
          <div className='relative mb-16 mt-2 text-sm text-gray-500'>
            <div className='w-full bg-gray-200 rounded-full h-1.5 mb-4'>
              <div className='bg-gray-700 h-1.5 rounded-full' style={{ width: `${strength}%` }} />
            </div>
            <span className='absolute start-0 -bottom-6'>Weak</span>
            <span className='absolute start-1/2 -translate-x-1/2 -bottom-6'>Enough</span>
            <span className='absolute end-0 -bottom-6'>Strong</span>
          </div>
          <InputPassword onChange={handleChangeConfirm} label='Confirm password' />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
        <Button onClick={handleProceed} label={label} disabled={disabled} />
      </ButtonsOnBottom>
    </div>
  )
}

export default InitPassword
