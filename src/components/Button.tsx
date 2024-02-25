interface ButtonProps {
  disabled?: boolean
  label: string
  onClick: (arg0: any) => void
  secondary?: boolean
}

function Button({ disabled, label, onClick, secondary }: ButtonProps) {
  const className =
    'px-8 py-3 font-semibold mt-4 rounded-full w-full disabled:opacity-50 ' +
    (secondary ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-100')

  return (
    <button className={className} disabled={disabled} onClick={onClick} type='button'>
      {label}
    </button>
  )
}

export default Button
