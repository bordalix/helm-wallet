import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Subtitle from '../../components/Subtitle'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'

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
      <div>
        <Title text='Reload' />
        <Subtitle text='Reload your UTXOs' />
        <select className='py-3 px-4 text-lg border-2 mt-10' onChange={handleChange} value={config.explorer}>
          {[20, 40, 80].map((e, i) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </div>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
        <Button onClick={handleRestore} label='Reload' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Reload
