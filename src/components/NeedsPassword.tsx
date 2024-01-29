import { useState } from 'react'
import Input from './Input'
import Button from './Button'

function NeedsPassword({ setPassword }: any) {
  const [pass, setPass] = useState('')
  return (
    <div className='flex h-screen'>
      <div className='m-auto'>
        <div className='text-center px-8 mt-10'>
          <Input label='Insert storage password' name='storagepass' onChange={(e: any) => setPass(e.target.value)} />
          <Button label='Continue' onClick={() => setPassword(pass)} />
        </div>
      </div>
    </div>
  )
}

export default NeedsPassword
