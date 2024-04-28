import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Container from '../../components/Container'
import Content from '../../components/Content'

export default function Tor() {
  const { toggleShowConfig } = useContext(ConfigContext)

  return (
    <Container>
      <Content>
        <Title text='Tor' subtext='Go fully anonymous' />
        <p>
          To use Tor, open this site on the{' '}
          <a href='https://www.torproject.org/' className='pointer-cursor underline'>
            Tor Browser
          </a>
        </p>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
