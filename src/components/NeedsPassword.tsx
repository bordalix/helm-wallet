import { useContext, useEffect, useState } from 'react'
import Input from './Input'
import Button from './Button'
import { readMnemonicFromStorage } from '../lib/storage'
import Modal from './Modal'
import LoadingIcon from '../icons/Loading'
import Error from './Error'
import { WalletContext } from '../providers/wallet'
import { authenticateUser } from '../lib/biometrics'
import FingerprintIcon from '../icons/Fingerprint'

interface NeedsPasswordProps {
  onClose?: () => void
  onMnemonic: (arg0: string) => void
}

export default function NeedsPassword({ onClose, onMnemonic }: NeedsPasswordProps) {
  const { wallet } = useContext(WalletContext)
  const [disabled, setDisabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(true)
  const [pass, setPass] = useState('')

  useEffect(() => {
    if (!wallet.lockedByBiometrics) return
    authenticateUser()
      .then(handleProceed)
      .catch(() => setError('Biometrics failed'))
  }, [wallet.lockedByBiometrics])

  useEffect(() => {
    setDisabled(Boolean(error))
  }, [error])

  const handleChange = (e: any) => {
    setPass(e.target.value)
    setError('')
  }

  const handleClick = () => handleProceed(pass)

  const handleClose = () => {
    setLoading(false)
    setOpen(false)
    if (onClose) onClose()
  }

  const handleProceed = async (password: string) => {
    setLoading(true)
    setDisabled(true)
    readMnemonicFromStorage(password).then((mnemonic) => {
      if (mnemonic) {
        onMnemonic(mnemonic)
        setOpen(false)
      } else setError('Invalid password')
      setLoading(false)
    })
  }

  return (
    <Modal open={open} onClose={handleClose}>
      {loading ? (
        <LoadingIcon small />
      ) : (
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          {wallet.lockedByBiometrics ? (
            <FingerprintIcon />
          ) : (
            <>
              <Input label='Insert password' onChange={handleChange} type='password' />
              <Button label='Unlock' onClick={handleClick} disabled={disabled} />
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
