import { ReactElement } from 'react'

interface ButtonProps {
  clean?: boolean
  disabled?: boolean
  icon?: ReactElement
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  secondary?: boolean
}

export default function Button({ clean, disabled, icon, label, onClick, secondary }: ButtonProps) {
  const className =
    'cursor-pointer px-8 py-3 font-semibold rounded-md w-full disabled:opacity-50 border ' +
    (secondary
      ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-800'
      : clean
      ? 'text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-800'
      : 'bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-800 border-gray-200 dark:border-gray-800')

  return (
    <button className={className} disabled={disabled} onClick={onClick} type='button'>
      <div className='flex justify-center items-center'>
        {icon ?? null}
        {label}
      </div>
    </button>
  )
}
