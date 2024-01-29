import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { networkNames } from '../../lib/networks'

function Network() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => updateConfig({ ...config, network: e.target.value })

  return (
    <div className='flex flex-col h-full justify-between'>
      <div>
        <Title text='Network' />
        <Subtitle text='Change your network' />
        <select className='py-3 px-4 text-lg border-2 mt-10' onChange={handleChange} value={config.network}>
          {networkNames.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Network
