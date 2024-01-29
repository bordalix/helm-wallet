function Input({ label, left, name, onChange, placeholder, right, type }: any) {
  const commonSidesClassName = 'w-16 pt-3 mx-auto text-sm bg-gray-700 text-gray-100'

  const inputClassName =
    (!left ? 'rounded-l-md' : !right ? 'rounded-r-md' : '') + ' w-full p-3 text-sm font-semibold bg-gray-100'

  return (
    <fieldset className='w-full text-gray-800'>
      {label ? (
        <label htmlFor={name} className='block text-sm text-left font-medium mb-1'>
          {label}
        </label>
      ) : null}
      <div className='flex'>
        {left ? <p className={`${commonSidesClassName} rounded-l-md`}>{left}</p> : null}
        <input
          className={inputClassName}
          name={name ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          type={type ?? 'text'}
        />
        {right ? <p className={`${commonSidesClassName} rounded-r-md`}>{right}</p> : null}
      </div>
    </fieldset>
  )
}

export default Input
