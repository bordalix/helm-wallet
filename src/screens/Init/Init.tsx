import { useContext } from 'react'
import Button from '../../components/Button'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'

function Init() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { setShowModal, wallet } = useContext(WalletContext)

  const debug = () => {
    console.log('config', config)
    console.log('wallet', wallet)
    setShowModal(true)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='mt-24'>
        <Title text='Thor wallet' />
        <Subtitle text='The wallet even your grandma can use' />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.InitNew)} label='New wallet' />
        <Button onClick={() => navigate(Pages.InitOld)} label='Restore wallet' />
        <Button onClick={debug} label='Debug' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Init
