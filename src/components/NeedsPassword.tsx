import { useState } from 'react'
import Input from './Input'
import Button from './Button'

interface NeedsPasswordProps {
  setPassword: (arg0: string) => void
}

function NeedsPassword({ setPassword }: NeedsPasswordProps) {
  const [pass, setPass] = useState('')
  return (
    <div className='flex h-screen'>
      <div className='m-auto'>
        <div className='text-center px-8 mt-10'>
          <Input label='Insert storage password' onChange={(e: any) => setPass(e.target.value)} />
          <Button label='Continue' onClick={() => setPassword(pass)} />
        </div>
      </div>
    </div>
  )
}

export default NeedsPassword
