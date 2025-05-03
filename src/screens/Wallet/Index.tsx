import { useContext } from 'react'
import Balance from '../../components/Balance'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'
import { WalletContext } from '../../providers/wallet'
import { getBalance } from '../../lib/wallet'
import Container from '../../components/Container'
import Content from '../../components/Content'
import QRCodeIcon from '../../icons/QRCode'
import ScanIcon from '../../icons/Scan'
import TransactionsList from '../../components/TransactionsList'
import { BoltzContext } from '../../providers/boltz'
import Restoring from '../../components/Restoring'
import { ConfigContext } from '../../providers/config'
import { ConnectionContext } from '../../providers/connection'

export default function Wallet() {
  const { limits, maxAllowedAmount } = useContext(BoltzContext)
  const { config } = useContext(ConfigContext)
  const { offline } = useContext(ConnectionContext)
  const { navigate } = useContext(NavigationContext)
  const { getChainSource, reconnectChainSource, restoring, wallet } = useContext(WalletContext)

  const canReceive = !offline
  const canSend = maxAllowedAmount(wallet) > limits.minimal && !config.pos && !offline
  const chainSource = getChainSource()

  const handleSend = () => {
    if (!chainSource?.isConnected()) reconnectChainSource(wallet)
    navigate(Pages.SendInvoice)
  }

  const handleReceive = () => {
    if (!chainSource?.isConnected()) reconnectChainSource(wallet)
    navigate(Pages.ReceiveAmount)
  }

  return (
    <Container>
      <Content>
        <Balance sats={getBalance(wallet)} />
        {restoring ? <Restoring restoring={restoring} /> : <TransactionsList short />}
      </Content>
      <ButtonsOnBottom>
        <Button icon={<ScanIcon />} label='Sendy' onClick={handleSend} disabled={!canSend} />
        <Button icon={<QRCodeIcon />} label='Receive' onClick={handleReceive} disabled={!canReceive} />
      </ButtonsOnBottom>
    </Container>
  )
}
