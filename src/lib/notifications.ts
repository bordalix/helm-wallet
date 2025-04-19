import { prettyNumber } from './format'
import { unitLabels, Unit } from './units'

export const isNotificationApiSupported =
  'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

export const requestPermission = async (): Promise<boolean> => {
  if (!isNotificationApiSupported) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

const sendNotification = (title: string, body: string) => {
  if (!isNotificationApiSupported) return
  const options = { body, icon: '/favicon.png' }
  try {
    new Notification(title, options)
  } catch {
    try {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options)
      })
    } catch {}
  }
}

export const notifyPaymentReceived = (sats: number) => {
  const body = `You received ${prettyNumber(sats)} ${unitLabels[Unit.SAT]}`
  const title = 'Payment received'
  sendNotification(title, body)
}

export const notifyTestNotification = () => {
  const body = 'If you read this, everything is ok'
  const title = 'Test notification'
  sendNotification(title, body)
}
