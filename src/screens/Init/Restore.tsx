import { useContext, useEffect, useState } from 'react'
import { validateMnemonic } from 'bip39'
import Button from '../../components/Button'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Columns from '../../components/Columns'
import Word from '../../components/Word'
import { ConfigContext } from '../../providers/config'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'

function InitOld() {
  const { config, updateConfig } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { wallet, updateWallet } = useContext(WalletContext)

  const [invalid, setInvalid] = useState(false)
  const [passphrase, setPassphrase] = useState(['', '', '', '', '', '', '', '', '', '', '', ''])

  const completed = [...passphrase].filter((a) => a)?.length === 12

  useEffect(() => {
    setInvalid(false)
    if (!completed) return
    setInvalid(!validateMnemonic(passphrase.join(' ')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passphrase])

  const handleChange = (e: any, i: number) => {
    const { value } = e.target
    if (i === 0 && value.split(/\s+/).length === 12) {
      setPassphrase(value.split(/\s+/))
    } else {
      const clone = [...passphrase]
      clone[i] = value
      setPassphrase(clone)
    }
  }

  const handleCancel = () => navigate(Pages.Init)

  const handleProceed = () => {
    const mnemonic = passphrase.join(' ')
    updateWallet({ ...wallet, mnemonic })
    navigate(Pages.InitPassword)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Restore wallet' />
        <Subtitle text='Insert your secret words' />
        <div className='grow'>
          <Columns>
            {[...passphrase].map((word, i) => (
              <Word
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                left={i + 1}
                onChange={(e: any) => handleChange(e, i)}
                value={passphrase[i]}
              />
            ))}
          </Columns>
          {invalid ? <p className='mt-4 text-red-600'>Invalid mnemonic</p> : null}
        </div>
      </div>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        {completed && !invalid ? <Button onClick={handleProceed} label='Continue' /> : null}
      </ButtonsOnBottom>
    </div>
  )
}

export default InitOld
