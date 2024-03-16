import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'

export default function Logout() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { logout } = useContext(WalletContext)

  const handleLogout = () => {
    logout()
    toggleShowConfig()
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Logout' />
        <p className='mt-10 mb-4 max-w-64 mx-auto'>After logout you'll need to re-enter your password to send funds.</p>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleLogout} label='Logout' />
        <Button onClick={toggleShowConfig} label='Cancel' secondary />
      </ButtonsOnBottom>
    </div>
  )
}
