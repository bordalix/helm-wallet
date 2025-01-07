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

interface InputWithActionProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onClick: React.MouseEventHandler<HTMLDivElement>
  pill: string
  text: string
}

export function InputWithAction({ onChange, onClick, pill, text }: InputWithActionProps) {
  return (
    <div className='flex items-center h-12 rounded-l-md bg-gray-100 dark:bg-gray-800'>
      <input
        type='text'
        value={text}
        onChange={onChange}
        className='w-full p-3 text-sm font-semibold rounded-l-md bg-gray-100 dark:bg-gray-800 focus-visible:outline-none'
      />
      <div
        className='w-16 h-full flex items-center rounded-r-md cursor-pointer text-sm bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 border-gray-200 dark:border-gray-700'
        onClick={onClick}
      >
        <div className='mx-auto font-semibold'>{pill}</div>
      </div>
    </div>
  )
}
