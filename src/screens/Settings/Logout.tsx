import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'

function Logout() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleProceed = () => {
    updateConfig({ ...config, mnemonic: '' })
    toggleShowConfig()
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Are you sure?' />
        <Subtitle text='This operation cannot be undone' />
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
        <Button onClick={handleProceed} label='Proceed' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Logout
