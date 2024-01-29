import { useState } from 'react'
import EyeOpenIcon from '../icons/EyeOpen'
import EyeClosedIcon from '../icons/EyeClosed'

function InputPassword({ label, name, onChange }: any) {
  const [type, setType] = useState('password')

  const toggleVisibility = () => setType(type === 'text' ? 'password' : 'text')

  return (
    <div>
      {label ? (
        <label htmlFor={name} className='block text-sm text-left font-medium mb-1'>
          {label}
        </label>
      ) : null}
      <div className='flex items-center h-12 rounded-l-md bg-gray-100'>
        <input className='w-full p-3 text-sm font-semibold rounded-l-md bg-gray-100' onChange={onChange} type={type} />
        <div
          className='w-16 h-full flex items-center rounded-r-md text-sm bg-gray-700 text-gray-100'
          onClick={toggleVisibility}
        >
          <div className='mx-auto'>{type === 'password' ? <EyeOpenIcon /> : <EyeClosedIcon />}</div>
        </div>
      </div>
    </div>
  )
}

export default InputPassword
