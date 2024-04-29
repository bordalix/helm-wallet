import { ReactNode } from 'react'
import Label from './Label'

interface SelectProps {
  children: ReactNode
  label?: string
  onChange: (arg0: any) => void
  value: string | number | boolean
}

export default function Select({ children, label, onChange, value }: SelectProps) {
  const className =
    'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 text-lg rounded-lg w-full p-2.5'

  if (typeof value === 'boolean') value = value ? 1 : 0

  return (
    <div className='pt-10'>
      {label ? <Label text={label} /> : null}
      <select className={className} onChange={onChange} value={value}>
        {children}
      </select>
    </div>
  )
}
