import Label from './Label'

interface InputProps {
  label?: string
  left?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  optional?: boolean
  placeholder?: string
  right?: string
  subtext?: string
  type?: string
}

export default function Input({ label, left, onChange, optional, placeholder, right, subtext, type }: InputProps) {
  const commonSidesClassName = 'w-16 pt-3 mx-auto text-sm bg-gray-700 dark:bg-gray-200 text-gray-100 dark:text-gray-800'

  const inputClassName =
    (!left ? 'rounded-l-md ' : '') +
    (!right ? 'rounded-r-md ' : '') +
    'w-full p-3 text-sm font-semibold bg-gray-100 dark:bg-gray-800'

  return (
    <fieldset className='w-full text-gray-800 dark:text-gray-100'>
      <div className='flex justify-between items-center'>
        {label ? <Label text={label} /> : null}
        {optional ? <p className='text-xs'>Optional</p> : null}
      </div>
      <div className='flex h-12'>
        {left ? <p className={`${commonSidesClassName} rounded-l-md`}>{left}</p> : null}
        <input className={inputClassName} onChange={onChange} placeholder={placeholder} type={type ?? 'text'} />
        {right ? <p className={`${commonSidesClassName} rounded-r-md`}>{right}</p> : null}
      </div>
      {subtext ? <p className='text-xs mb-2 sm:mb-4 sm:mt-2'>{subtext}</p> : null}
    </fieldset>
  )
}
