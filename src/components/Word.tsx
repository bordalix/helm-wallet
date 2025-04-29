interface WordProps {
  left: number
  onChange?: (arg0: any) => void
  text: string
}

export default function Word({ left, onChange, text }: WordProps) {
  const className =
    'w-full p-3 text-sm text-left font-semibold rounded-r-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'

  return (
    <fieldset className='w-full'>
      <div className='flex text-gray-100 dark:text-gray-800'>
        <p className='w-16 pt-3 mx-auto text-sm rounded-l-md bg-gray-900 dark:bg-gray-100'>{left}</p>
        {onChange ? (
          <input className={className} onChange={onChange} value={text} />
        ) : (
          <p className={className}>{text}</p>
        )}
      </div>
    </fieldset>
  )
}
