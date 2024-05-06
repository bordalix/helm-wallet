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
import { inOneMinute, someSeconds } from '../../../lib/constants'
import { NewAddress, generateAddress } from '../../../lib/address'
import { ElectrumHistory } from '../../../lib/chainsource'
import Loading from '../../../components/Loading'
import { ConfigContext } from '../../../providers/config'

export default function ReceiveInvoice() {
  const { config } = useContext(ConfigContext)
  const { recvInfo, setRecvInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { chainSource, increaseIndex, reloadWallet, wallet } = useContext(WalletContext)

  const label = 'Copy to clipboard'
  const [address, setAddress] = useState<NewAddress>()
  const [buttonLabel, setButtonLabel] = useState(label)
  const [clickCounter, setClickCounter] = useState(0)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState('')

  const firefox = !navigator.clipboard || !('writeText' in navigator.clipboard)
  const finishedTxIds: string[] = []

  const onFinish = (txid: string) => {
    // avoid double call to onFinish for same txid
    if (finishedTxIds.includes(txid)) return
    finishedTxIds.push(txid)
    increaseIndex()
    setTimeout(() => reloadWallet(wallet, true), someSeconds)
    setTimeout(() => reloadWallet(wallet, true), inOneMinute)
    setRecvInfo({ ...recvInfo, txid })
    navigate(Pages.ReceiveSuccess)
  }

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleCopy = async () => {
    await copyToClipboard(qrValue ?? '')
    setButtonLabel('Copied')
    setTimeout(() => setButtonLabel(label), 2000)
  }

  useEffect(() => {
    if (!invoice) {
      try {
        generateAddress(wallet).then((addr) => {
          setAddress(addr)
          reverseSwap(Number(recvInfo.amount), addr.confidentialAddress, config, wallet, onFinish, setInvoice)
          chainSource.waitForAddressReceivesTx(addr.address).then(() => {
            chainSource.fetchHistories([addr.script]).then((histories: ElectrumHistory[]) => {
              const newTx = histories.find((tx) => tx.height <= 0)
              if (newTx) onFinish(newTx.tx_hash ?? '')
            })
          })
        })
      } catch (error) {
        setError(extractError(error))
      }
    }
  }, [invoice])

  const qrValue = Math.floor(clickCounter / 3) % 2 === 0 ? invoice : address?.confidentialAddress

  const GeneratingInvoice = () => (
    <>
      <Loading />
      <p>Generating invoice</p>
    </>
  )

  return (
    <Container>
      <Content>
        <Title text='Invoice' subtext='Scan or copy to clipboard' />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          {invoice ? (
            <div onClick={() => setClickCounter((c) => c + 1)}>
              <QrCode value={qrValue ?? ''} />
            </div>
          ) : (
            <GeneratingInvoice />
          )}
        </div>
      </Content>
      <ButtonsOnBottom>
        {!firefox && <Button onClick={handleCopy} label={buttonLabel} />}
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
