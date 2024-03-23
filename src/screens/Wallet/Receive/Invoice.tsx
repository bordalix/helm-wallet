import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import QrCode from '../../../components/QrCode'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import Error from '../../../components/Error'
import { FlowContext, emptyRecvInfo } from '../../../providers/flow'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { extractError } from '../../../lib/error'
import { WalletContext } from '../../../providers/wallet'
import { reverseSwap } from '../../../lib/reverseSwap'
import { copyToClipboard } from '../../../lib/clipboard'
import { timeToReload } from '../../../lib/constants'

export default function ReceiveInvoice() {
  const { recvInfo, setRecvInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { increaseIndex, reloadWallet, wallet } = useContext(WalletContext)

  const label = 'Copy to clipboard'
  const [buttonLabel, setButtonLabel] = useState(label)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState('')

  const firefox = !navigator.clipboard || !('writeText' in navigator.clipboard)

  const onFinish = (txid: string) => {
    increaseIndex()
    setTimeout(() => reloadWallet(wallet), timeToReload)
    setTimeout(() => reloadWallet(wallet), 60_000)
    setRecvInfo({ ...recvInfo, txid })
    navigate(Pages.ReceiveSuccess)
  }

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleCopy = async () => {
    await copyToClipboard(invoice)
    setButtonLabel('Copied')
    setTimeout(() => setButtonLabel(label), 2000)
  }

  useEffect(() => {
    if (!invoice) {
      try {
        reverseSwap(Number(recvInfo.amount), wallet, onFinish, setInvoice)
      } catch (error) {
        setError(extractError(error))
      }
    }
  }, [invoice])

  return (
    <Container>
      <Content>
        <Title text='Invoice' subtext='Scan or copy to clipboard' />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          <QrCode invoice={invoice} />
        </div>
      </Content>
      <ButtonsOnBottom>
        {!firefox && <Button onClick={handleCopy} label={buttonLabel} />}
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
