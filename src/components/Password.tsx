import { useState } from 'react'
import EyeOpenIcon from '../icons/EyeOpen'
import EyeClosedIcon from '../icons/EyeClosed'
import InputPassword from './InputPassword'

const calcStrength = (pass: string, max = 100): number => {
  let strength = pass.length * 5
  if (pass.match(/\d/)) strength += 10
  if (pass.match(/\W/)) strength += 10
  return strength < max ? strength : max
}

function Password({ onChange }: any) {
  const [strength, setStrength] = useState(0)
  const [password, setPassword] = useState('')

  const handleChangeInsert = (e: any) => {
    const pass = e.target.value
    setStrength(calcStrength(pass))
    setPassword(pass)
  }

  const handleChangeConfirm = (e: any) => {
    const pass = e.target.value
    if (pass === password) onChange(pass)
  }

  return (
    <div>
      <InputPassword onChange={handleChangeInsert} label='Insert password' />
      <div className='relative mb-16 mt-2 text-sm text-gray-500'>
        <div className='w-full bg-gray-200 rounded-full h-1.5 mb-4'>
          <div className='bg-gray-700 h-1.5 rounded-full' style={{ width: `${strength}%` }} />
        </div>
        <span className='absolute start-0 -bottom-6'>Weak</span>
        <span className='absolute start-1/2 -translate-x-1/2 -bottom-6'>Enough</span>
        <span className='absolute end-0 -bottom-6'>Strong</span>
      </div>
      <InputPassword onChange={handleChangeConfirm} label='Confirm password' />
    </div>
  )
}

export default Password
