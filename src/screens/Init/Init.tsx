import { useContext } from 'react'
import Button from '../../components/Button'
import Title from '../../components/Title'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import Container from '../../components/Container'

export default function Init() {
  const { navigate } = useContext(NavigationContext)

  return (
    <Container>
      <div className='mt-24'>
        <Title text='Thor wallet' subtext='The wallet even your grandma can use' />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.InitNew)} label='New wallet' />
        <Button onClick={() => navigate(Pages.InitOld)} label='Restore wallet' />
      </ButtonsOnBottom>
    </Container>
  )
}
