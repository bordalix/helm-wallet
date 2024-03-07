import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'
import { balance, generateAddress } from '../../lib/wallet'
import Container from '../../components/Container'
import Content from '../../components/Content'
import QRCodeIcon from '../../icons/QRCode'
import ScanIcon from '../../icons/Scan'
import { readWalletFromStorage } from '../../lib/storage'

function Wallet() {
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  // get next address and respective pubkey
  if (wallet.masterBlindingKey)
    generateAddress(wallet).then((nextAddress) => {
      console.log('destinationAddress', nextAddress.address)
      console.log('confidentialAddress', nextAddress.confidentialAddress)
    })

  readWalletFromStorage().then(console.log)
  console.log('wallet', wallet)

  return (
    <Container>
      <Content>
        <Balance value={balance(wallet)} />
      </Content>
      <ButtonsOnBottom>
        <Button icon={<ScanIcon />} label='Send' onClick={() => navigate(Pages.SendInvoice)} />
        <Button icon={<QRCodeIcon />} label='Receive' onClick={() => navigate(Pages.ReceiveAmount)} />
      </ButtonsOnBottom>
    </Container>
  )
}

export default Wallet
