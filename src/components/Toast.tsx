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

export const toastCopiedToClipboard = () => {
  showToast(
    <div className='flex items-center p-0 text-sm'>
      <p>Copied to clipboard</p>
    </div>,
  )
}
