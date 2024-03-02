import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'

function Logout() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { resetWallet } = useContext(WalletContext)

  const handleProceed = () => {
    resetWallet()
    toggleShowConfig()
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Are you sure?' subtext='This operation cannot be undone' />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label='Proceed' />
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Logout
