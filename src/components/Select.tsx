import Label from './Label'

interface SelectProps {
  children: any
  label?: string
  onChange: (arg0: any) => void
  value: string | number
}

export default function Select({ children, label, onChange, value }: SelectProps) {
  const className = 'bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg w-80  p-2.5'

  return (
    <div className='pt-10'>
      {label ? <Label text={label} /> : null}
      <select className={className} onChange={onChange} value={value}>
        {children}
      </select>
    </div>
  )
}
