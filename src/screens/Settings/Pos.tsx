import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Select from '../../components/Select'
import Container from '../../components/Container'
import Content from '../../components/Content'
import NeedsPassword from '../../components/NeedsPassword'

export default function Pos() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const [needsAuth, setNeedsAuth] = useState(false)

  const handleChange = () => setNeedsAuth(true)

  const onAuth = () => {
    updateConfig({ ...config, pos: !config.pos })
    setNeedsAuth(false)
  }

  const onClose = () => setNeedsAuth(false)

  return (
    <Container>
      <Content>
        {needsAuth ? <NeedsPassword onClose={onClose} onMnemonic={onAuth} /> : null}
        <Title text='PoS' subtext='Use as Point of Sale' />
        <Select onChange={handleChange} value={config.pos ? 1 : 0}>
          <option value='1'>On</option>
          <option value='0'>Off</option>
        </Select>
        <p className='mt-10'>In PoS mode, only receive is available</p>
        <p className='mt-10'>Password is needed to set and unset this</p>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
