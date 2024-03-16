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
import { ConfigContext } from '../../../providers/config'
import { extractError } from '../../../lib/error'
import { WalletContext } from '../../../providers/wallet'
import { reverseSwap } from '../../../lib/swap'

function ReceiveInvoice() {
  const { config } = useContext(ConfigContext)
  const { recvInfo, setRecvInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  const label = 'Copy to clipboard'
  const [buttonLabel, setButtonLabel] = useState(label)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState('')

  const onFinish = (txid: string) => {
    setRecvInfo({ ...recvInfo, txid })
    navigate(Pages.ReceiveSuccess)
  }

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(() => {
      setButtonLabel('Copied')
      setTimeout(() => setButtonLabel(label), 2000)
    })
  }

  useEffect(() => {
    if (!invoice) {
      try {
        reverseSwap(Number(recvInfo.amount), config, wallet, onFinish, setInvoice)
      } catch (error) {
        setError(extractError(error))
      }
    }
  }, [invoice])

  return (
    <Container>
      <Content>
        <Title text='Invoice' subtext='Scan or copy to clipboard' />
        {error ? <Error error={error} /> : null}
        <QrCode invoice={invoice} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCopy} label={buttonLabel} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default ReceiveInvoice
