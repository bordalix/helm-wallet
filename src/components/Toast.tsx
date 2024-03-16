interface ToastProps {
  text: string
}

export default function Toast({ text }: ToastProps) {
  return <p className='bg-gray-500 font-semibold max-w-48 mx-auto mt-2 p-1 rounded-md text-sm text-white '>{text}</p>
}
