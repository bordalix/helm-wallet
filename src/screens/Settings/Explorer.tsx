import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { getExplorerNames } from '../../lib/explorers'
import Select from '../../components/Select'
import Container from '../../components/Container'
import Content from '../../components/Content'
import Toast from '../../components/Toast'

function Explorer() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const [showToast, setShowToast] = useState(false)

  const handleChange = (e: any) => {
    updateConfig({ ...config, explorer: e.target.value })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2_000)
  }

  return (
    <Container>
      <Content>
        <Title text='Explorer' subtext='Change your explorer' />
        <Select onChange={handleChange} value={config.explorer}>
          {getExplorerNames(config).map((e) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
        {showToast ? <Toast text='Saved' /> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default Explorer
