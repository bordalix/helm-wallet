import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Columns from '../../components/Columns'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import Word from '../../components/Word'
import { generateMnemonic } from 'bip39'
import { NavigationContext, Pages } from '../../providers/navigation'
import { Mnemonic } from '../../lib/types'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'

function InitNew() {
  const { navigate } = useContext(NavigationContext)
  const { wallet, updateWallet } = useContext(WalletContext)

  const mnemonic = generateMnemonic() as Mnemonic

  const handleCancel = () => navigate(Pages.Init)

  const handleProceed = () => {
    updateWallet({ ...wallet, mnemonic })
    navigate(Pages.InitPassword)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Your new wallet' />
        <Subtitle text='Write down the following words' />
        <div className='grow'>
          <Columns>
            {mnemonic.split(' ').map((word, i) => (
              <Word key={word} left={i + 1} text={word} />
            ))}
          </Columns>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCancel} label='Cancel' secondary />
        <Button onClick={handleProceed} label='Continue' />
      </ButtonsOnBottom>
    </div>
  )
}

export default InitNew
