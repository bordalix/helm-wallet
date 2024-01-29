import { useContext } from 'react'
import Button from '../../components/Button'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'

function Init() {
  const { navigate } = useContext(NavigationContext)

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='mt-24'>
        <Title text='Thor wallet' />
        <Subtitle text='The wallet even your grandma can use' />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.InitNew)} label='New wallet' />
        <Button onClick={() => navigate(Pages.InitOld)} label='Restore wallet' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Init
