import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import Select from '../../components/Select'
import Content from '../../components/Content'
import LoadingIcon from '../../icons/Loading'
import { gapLimits } from '../../lib/wallet'

export default function Reload() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { reloading, reloadWallet, updateWallet, wallet } = useContext(WalletContext)

  const handleChange = (e: any) => {
    const gapLimit = Number(e.target.value)
    if (gapLimits.includes(gapLimit)) updateWallet({ ...wallet, gapLimit })
  }

  const handleReload = () => reloadWallet(wallet)

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Reload' subtext='Reload your UTXOs' />
        <Select label='Gap limit' onChange={handleChange} value={wallet.gapLimit}>
          {gapLimits.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </Select>
        {reloading ? (
          <center className='my-10'>
            <LoadingIcon />
            <p className='mt-10'>You can go back to wallet, reloading will keep working on the background</p>
          </center>
        ) : (
          <div className='flex flex-col gap-6 mt-10'>
            <p>Increase limit if you're missing some coins</p>
            <p>
              Higher values makes reloads take longer
              <br />
              and increases data usage
            </p>
          </div>
        )}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleReload} label='Reload' disabled={reloading} />
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}
