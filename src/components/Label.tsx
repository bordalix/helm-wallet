interface LabelProps {
  text: string
}

export default function Label({ text }: LabelProps) {
  const className = 'block text-sm text-left font-medium mb-1'
  return <label className={className}>{text}</label>
}
