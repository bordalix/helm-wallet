import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import PaymentDetails, { PaymentDetailsProps } from '../../../components/PaymentDetails'
import { getBalance } from '../../../lib/wallet'
import { WalletContext } from '../../../providers/wallet'
import { decodeInvoice } from '../../../lib/lightning'
import Error from '../../../components/Error'
import { NetworkName } from '../../../lib/network'
import { extractError } from '../../../lib/error'

export default function SendDetails() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { wallet } = useContext(WalletContext)

  const [details, setDetails] = useState<PaymentDetailsProps>()
  const [error, setError] = useState('')

  const { address, invoice, satoshis } = sendInfo

  const wrongNetwork = (invoice: string) =>
    (/^lnbc/.test(invoice) && wallet.network !== NetworkName.Liquid) ||
    (!/^lnbc/.test(invoice) && wallet.network === NetworkName.Liquid)

  useEffect(() => {
    if (!address && !invoice) return setError('Missing invoice')
    if (address && satoshis) {
      return setDetails({
        address,
        satoshis,
      })
    }
    if (invoice) {
      if (wrongNetwork(invoice)) {
        return setError('Invoice received is for a different network. Change network on Settings and try again.')
      }
      try {
        const { note, satoshis } = decodeInvoice(sendInfo.invoice ?? '')
        if (!satoshis) return setError('Error decoding invoice')
        return setDetails({
          invoice,
          note,
          satoshis,
        })
      } catch (err) {
        setError(extractError(err))
      }
    }
  }, [sendInfo.invoice])

  const handleContinue = () => navigate(Pages.SendFees)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const lowBalance = getBalance(wallet) < (details?.satoshis ?? 0)
  const disabled = lowBalance || Boolean(error)
  const label = error ? 'Something went wrong' : lowBalance ? 'Insufficient funds' : 'Continue'

  return (
    <Container>
      <Content>
        <Title text='Payment details' />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          <PaymentDetails details={details} />
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleContinue} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
