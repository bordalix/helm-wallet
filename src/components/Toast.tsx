import toast, { Toaster } from 'react-hot-toast'

export default function Toast() {
  return <Toaster />
}

const showToast = (message: any, duration = 2100) => {
  toast(message, {
    className: 'toast',
    duration,
  })
}

const toastButton = (message: string, onClick: () => void): JSX.Element => (
  <button className='border font-semibold px-1 py-0.5 rounded-md text-xs' onClick={onClick}>
    {message}
  </button>
)

export const toastNewVersionAvailable = () => {
  const duration = 21000
  showToast(
    <div className='flex gap-4 items-center p-0 text-sm'>
      <p>New version available</p>
      {toastButton('Reload', () => window.location.reload())}
    </div>,
    duration,
  )
}

export const toastCopiedToClipboard = () => {
  showToast(
    <div className='flex items-center p-0 text-sm'>
      <p>Copied to clipboard</p>
    </div>,
  )
}
