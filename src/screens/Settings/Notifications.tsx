import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'

function Notifications() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => {
    const notifications = Boolean(parseInt(e.target.value))
    Notification.requestPermission().then((result) => {
      if (result === 'granted') {
        updateConfig({ ...config, notifications })
      }
    })
  }

  const value = config.notifications ? 1 : 0

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Notifications' />
        <Subtitle text='Allow to receive notifications' />
        <select className='py-3 px-4 text-lg border-2 mt-10' onChange={handleChange} value={value}>
          <option value='0'>Not allowed</option>
          <option value='1'>Allowed</option>
        </select>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Notifications
