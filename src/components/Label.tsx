interface LabelProps {
  text: string
}

function Label({ text }: LabelProps) {
  const className = 'block text-sm text-left font-medium mb-1'

  return <label className={className}>{text}</label>
}

export default Label
