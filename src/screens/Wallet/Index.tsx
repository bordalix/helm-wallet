import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'

function Wallet() {
  const { navigate } = useContext(NavigationContext)

  return (
    <div className='flex flex-col h-full justify-between'>
      <div className='mt-24'>
        <Balance />
      </div>
      <ButtonsOnBottom>
        <Button onClick={() => navigate(Pages.SendInvoice)} label='Send' />
        <Button onClick={() => navigate(Pages.ReceiveAmount)} label='Receive' />
      </ButtonsOnBottom>
    </div>
  )
}

export default Wallet
