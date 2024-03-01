import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Select from '../../components/Select'
import Content from '../../components/Content'
import Toast from '../../components/Toast'

function Notifications() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const [showToast, setShowToast] = useState(false)

  const handleChange = (e: any) => {
    const notifications = Boolean(parseInt(e.target.value))
    Notification.requestPermission().then((result) => {
      if (result === 'granted') {
        updateConfig({ ...config, notifications })
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2_000)
      }
    })
  }

  const value = config.notifications ? 1 : 0

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Notifications' />
        <Subtitle text='Allow to receive notifications' />
        <Select onChange={handleChange} value={value}>
          <option value='0'>Not allowed</option>
          <option value='1'>Allowed</option>
        </Select>
        {showToast ? <Toast text='Saved' /> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Notifications
