interface LabelProps {
  onClick?: () => void
  pointer?: boolean
  pulse?: boolean
  text: string
  underline?: boolean
}

export default function Label({ onClick, pointer, pulse, text, underline }: LabelProps) {
  const className =
    'block text-sm text-left font-medium mb-1' +
    (pulse ? ' animate-pulse' : '') +
    (pointer ? ' cursor-pointer' : '') +
    (underline ? ' underline' : '')
  return (
    <label className={className} onClick={onClick}>
      {text}
    </label>
  )
}
