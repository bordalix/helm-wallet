import { useEffect, useState } from 'react'
import Input from './Input'
import Button from './Button'
import { readWallet } from '../lib/storage'

interface NeedsPasswordProps {
  setPassword: (arg0: string) => void
}

function NeedsPassword({ setPassword }: NeedsPasswordProps) {
  const [disabled, setDisabled] = useState(false)
  const [error, setError] = useState('')
  const [pass, setPass] = useState('')

  const handleChange = (e: any) => {
    setPass(e.target.value)
    setError('')
  }

  const handleProceed = async () => {
    setDisabled(true)
    readWallet(pass).then((w) => {
      if (w) setPassword(pass)
      else setError('Invalid password')
    })
  }

  useEffect(() => {
    setDisabled(Boolean(error))
  }, [error])

  return (
    <>
      <Input label='Insert password' onChange={handleChange} />
      {error ? <p className='bg-red-500 font-semibold mt-2 p-1 rounded-md text-sm text-white'>{error}</p> : null}
      <Button label='Continue' onClick={handleProceed} disabled={disabled} />
    </>
  )
}

export default NeedsPassword
