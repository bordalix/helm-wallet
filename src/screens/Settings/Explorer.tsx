import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { getExplorerNames } from '../../lib/explorers'
import Select from '../../components/Select'
import SuccessIcon from '../../icons/Success'

function Explorer() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => updateConfig({ ...config, explorer: e.target.value })

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='w-80 mx-auto'>
        <Title text='Explorer' />
        <Subtitle text='Change your explorer' />
        <Select onChange={handleChange} value={config.explorer}>
          {getExplorerNames(config).map((e, i) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}

export default Explorer
