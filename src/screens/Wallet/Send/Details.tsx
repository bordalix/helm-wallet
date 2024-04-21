import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import InvoiceDetails from '../../../components/InvoiceDetails'
import { getBalance } from '../../../lib/wallet'
import { WalletContext } from '../../../providers/wallet'
import { decodeInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import { NetworkName } from '../../../lib/network'

export default function SendDetails() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const [error, setError] = useState('')

  useEffect(() => {
    if (!sendInfo.invoice) return setError('Missing invoice')
    if (
      (/^lnbc/.test(sendInfo.invoice) && wallet.network !== NetworkName.Liquid) ||
      (!/^lnbc/.test(sendInfo.invoice) && wallet.network === NetworkName.Liquid)
    )
      setError('Invoice received is for a different network. Change network on Settings and try again.')
  }, [sendInfo.invoice])

  const handleContinue = () => navigate(Pages.SendFees)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const { satoshis } = decodeInvoice(sendInfo.invoice ?? '')
  if (!satoshis) setError('Error decoding invoice')
  const lowBalance = getBalance(wallet) < (satoshis ?? 0)
  const disabled = lowBalance || Boolean(error)
  const label = error ? 'Something went wrong' : lowBalance ? 'Insufficient funds' : 'Continue'

  return (
    <Container>
      <Content>
        <Title text='Invoice details' />
        <div className='flex flex-col gap-2'>
          <InvoiceDetails invoice={sendInfo.invoice} />
          <Error error={Boolean(error)} text={error} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleContinue} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
