import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import { balance } from '../../lib/utxo'

function Wallet() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  const debug = () => {
    console.log({ ...config, ...wallet })
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='mt-24'>
        <Balance value={balance(wallet)} />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.SendInvoice)} label='Send' />
        <Button onClick={() => navigate(Pages.ReceiveAmount)} label='Receive' />
        <Button onClick={debug} label='Debug' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Wallet
