interface ErrorProps {
  error: string
}

export default function Error({ error }: ErrorProps) {
  return <p className='bg-red-500 font-semibold p-1 rounded-md text-sm text-white first-letter:uppercase'>{error}</p>
}
