interface ErrorProps {
  error: string
}

function Error({ error }: ErrorProps) {
  return <p className='bg-red-500 font-semibold p-1 rounded-md text-sm text-white first-letter:uppercase'>{error}</p>
}

export default Error
