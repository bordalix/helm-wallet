import { useEffect, useState } from 'react'
import Input from './Input'
import Button from './Button'
import { readMnemonicFromStorage } from '../lib/storage'
import Modal from './Modal'
import LoadingIcon from '../icons/Loading'
import Error from './Error'

interface NeedsPasswordProps {
  onClose?: () => void
  onMnemonic: (arg0: string) => void
}

export default function NeedsPassword({ onClose, onMnemonic }: NeedsPasswordProps) {
  const [disabled, setDisabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(true)
  const [pass, setPass] = useState('')

  const handleChange = (e: any) => {
    setPass(e.target.value)
    setError('')
  }

  const handleClose = () => {
    setLoading(false)
    setOpen(false)
    if (onClose) onClose()
  }

  const handleProceed = async () => {
    setLoading(true)
    setDisabled(true)
    readMnemonicFromStorage(pass).then((m) => {
      if (m) {
        onMnemonic(m)
        setOpen(false)
      } else setError('Invalid password')
      setLoading(false)
    })
  }

  useEffect(() => {
    setDisabled(Boolean(error))
  }, [error])

  return (
    <Modal open={open} onClose={handleClose}>
      {loading ? (
        <LoadingIcon small />
      ) : (
        <div className='flex flex-col gap-4'>
          <Input label='Insert password' onChange={handleChange} />
          {error ? <Error error={error} /> : null}
          <Button label='Unlock' onClick={handleProceed} disabled={disabled} />
        </div>
      )}
    </Modal>
  )
}
