interface ErrorProps {
  error: string
}

function Error({ error }: ErrorProps) {
  return <p className='bg-red-500 font-semibold max-w-48 mx-auto mt-2 p-1 rounded-md text-sm text-white'>{error}</p>
}

export default Error
