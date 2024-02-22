import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { getNetworkNames } from '../../lib/network'
import Select from '../../components/Select'
import Content from '../../components/Content'

function Network() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => updateConfig({ ...config, network: e.target.value })

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Network' />
        <Subtitle text='Change your network' />
        <Select onChange={handleChange} value={config.network}>
          {getNetworkNames().map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Network
