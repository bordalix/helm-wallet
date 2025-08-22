interface ErrorProps {
  text: string
}

export default function Error({ text }: ErrorProps) {
  if (!Boolean(text)) return null
  const className = 'bg-red-500 font-semibold md:p-x-4 p-1 rounded-md text-sm text-white first-letter:uppercase'
  return <p className={className}>{text}</p>
}
