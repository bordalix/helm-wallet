import { prettyNumber } from './format'

export const requestPermission = async (): Promise<boolean> => {
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export const notifyNewUpdateAvailable = () => {
  const title = 'Update available'
  const options = {
    body: `Close all tabs and re-open to update`,
    icon: '/favicon.png',
  }
  new Notification(title, options)
}

export const sendTestNotification = () => {
  const title = 'Test notification'
  const options = {
    body: 'If you read this, everything is ok',
    icon: '/favicon.png',
  }
  new Notification(title, options)
}

// TODO
export const paymentReceived = (sats: number) => {
  const title = 'Payment received'
  const options = {
    body: `You received ${prettyNumber(sats)} sats`,
    icon: '/favicon.png',
  }
  new Notification(title, options)
}
