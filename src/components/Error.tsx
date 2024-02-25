interface ErrorProps {
  error: string
}

function Error({ error }: ErrorProps) {
  return <p className='text-red-500'>{error}</p>
}

export default Error
