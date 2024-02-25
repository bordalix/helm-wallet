import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import Select from '../../components/Select'
import Content from '../../components/Content'

function Reload() {
  const { config, toggleShowConfig } = useContext(ConfigContext)
  const { reloadUtxos, wallet } = useContext(WalletContext)

  const [gap, setGap] = useState(20)

  const handleChange = (e: any) => setGap(e.target.value)

  const handleRestore = () => {
    reloadUtxos(wallet, gap)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Reload' />
        <Subtitle text='Reload your UTXOs' />
        <Select label='Gap limit' onChange={handleChange} value={config.explorer}>
          {[20, 40, 80].map((e, i) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
        <Button onClick={handleRestore} label='Reload' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Reload
