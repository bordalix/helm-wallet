import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import { getNetworkNames } from '../../lib/network'
import Select from '../../components/Select'
import Content from '../../components/Content'
import Toast from '../../components/Toast'
import { WalletContext } from '../../providers/wallet'

export default function Network() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { wallet, updateWallet } = useContext(WalletContext)

  const [showToast, setShowToast] = useState(false)

  const handleChange = (e: any) => {
    updateWallet({ ...wallet, network: e.target.value })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2_000)
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Network' subtext='Change your network' />
        <Select onChange={handleChange} value={wallet.network}>
          {getNetworkNames().map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        {showToast ? <Toast text='Saved' /> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}
