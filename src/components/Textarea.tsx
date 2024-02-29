import Label from './Label'

interface TextareaProps {
  children?: any
  label?: string
  onChange?: (arg0: any) => void
  value: string | number
}

function Textarea({ children, label, onChange, value }: TextareaProps) {
  const className = 'bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg w-80  p-2.5'
  const readOnly = typeof onChange === 'undefined'

  return (
    <div className='pt-10'>
      {label ? <Label text={label} /> : null}
      <textarea className={className} onChange={onChange} readOnly={readOnly} rows={3} value={value}>
        {children}
      </textarea>
    </div>
  )
}

export default Textarea
