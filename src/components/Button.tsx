import { ReactElement } from 'react'

interface ButtonProps {
  disabled?: boolean
  icon?: ReactElement
  label: string
  onClick: (arg0: any) => void
  secondary?: boolean
}

function Button({ disabled, icon, label, onClick, secondary }: ButtonProps) {
  const className =
    'px-8 py-3 font-semibold rounded-full w-full disabled:opacity-50 ' +
    (secondary ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-100')

  return (
    <button className={className} disabled={disabled} onClick={onClick} type='button'>
      <div className='flex justify-center items-center'>
        {icon ?? null}
        {label}
      </div>
    </button>
  )
}

export default Button
