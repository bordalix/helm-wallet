function Button({ disabled, onClick, label, secondary }: any) {
  const className =
    'px-8 py-3 font-semibold mt-4 rounded-full w-full disabled:opacity-75 ' +
    (secondary ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-100')

  return (
    <button className={className} disabled={disabled} onClick={onClick} type='button'>
      {label}
    </button>
  )
}

export default Button
