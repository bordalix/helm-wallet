import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Password from '../../components/Password'

function Encrypt() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const [password, setPassword] = useState('')

  const handleProceed = () => {
    updateConfig({ ...config, password })
    toggleShowConfig()
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Encrypt storage' />
        <Subtitle text='Define a password' />
        <div className='text-center px-8 mt-10'>
          <Password label='Storage password' onChange={setPassword} />
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
        <Button onClick={handleProceed} label={(password ? 'Save' : 'Reset') + ' password'} />
      </ButtonsOnBottom>
    </div>
  )
}

export default Encrypt
