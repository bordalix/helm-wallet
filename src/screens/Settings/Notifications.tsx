import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Select from '../../components/Select'
import Content from '../../components/Content'
import { isNotificationApiSupported, requestPermission, sendTestNotification } from '../../lib/notifications'

export default function Notifications() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => {
    if (!isNotificationApiSupported) return
    const enable = Boolean(parseInt(e.target.value))
    if (enable) {
      requestPermission().then((notifications) => {
        updateConfig({ ...config, notifications })
        if (notifications) sendTestNotification()
      })
    } else {
      updateConfig({ ...config, notifications: false })
    }
  }

  const value = config.notifications ? '1' : '0'

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Notifications' subtext='Allow to receive notifications' />
        <Select onChange={handleChange} value={value} disabled={!isNotificationApiSupported}>
          <option value='0'>Not allowed</option>
          <option value='1'>Allowed</option>
        </Select>
        <div className='flex flex-col gap-6 mt-10'>
          {isNotificationApiSupported ? (
            <>
              <p>Get notified when an update is available or a payment is received</p>
              <p>You'll need to grant permission if asked</p>
            </>
          ) : (
            <>
              <p>Your browser does not support the Notifications API</p>
              <p>If on iOS you'll need to 'Add to homescreen' and be running iOS 16.4 or higher</p>
            </>
          )}
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}
