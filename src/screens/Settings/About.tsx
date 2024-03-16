import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import Container from '../../components/Container'

export default function About() {
  const { toggleShowConfig } = useContext(ConfigContext)
  return (
    <Container>
      <Content>
        <Title text='About' />
        <p className='mt-10 mb-4'>
          A lightning wallet that uses liquid (L-BTC) for self-custody and{' '}
          <a className='underline cursor-pointer' href='https://boltz.exchange'>
            Boltz
          </a>{' '}
          swaps to send and receive lightning payments
        </p>
        <p className='underline cursor-pointer'>
          <a href='https://github.com/bordalix/thor'>Github</a>
        </p>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
