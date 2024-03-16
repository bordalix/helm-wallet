interface ToastProps {
  text: string
}

function Toast({ text }: ToastProps) {
  return <p className='bg-gray-500 font-semibold max-w-48 mx-auto mt-2 p-1 rounded-md text-sm text-white '>{text}</p>
}

export default Toast
