import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { balance } from '../../lib/liquid'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'
import { unblindUnspents } from '../../lib/blinder'

function Wallet() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  const debug = () => {
    console.log({ ...config, ...wallet })
    unblindUnspents(wallet.utxos)
    // updateConfig({ ...config, nextIndex: config.nextIndex + 1 })
  }
  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='mt-24'>
        <Balance value={balance(config, wallet)} />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.SendInvoice)} label='Send' />
        <Button onClick={() => navigate(Pages.ReceiveAmount)} label='Receive' />
        <Button onClick={debug} label='Address' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Wallet
