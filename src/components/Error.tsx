interface ErrorProps {
  error: boolean
  text: string
}

export default function Error({ error, text }: ErrorProps) {
  let className = error ? 'bg-red-500' : ''
  className += ' font-semibold md:p-x-4 p-1 rounded-md text-sm text-white first-letter:uppercase'
  return <p className={className}>&nbsp; {text} &nbsp;</p>
}
