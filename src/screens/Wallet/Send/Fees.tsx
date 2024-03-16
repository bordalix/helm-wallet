import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import { prettyNumber } from '../../../lib/format'
import { ConfigContext } from '../../../providers/config'
import { WalletContext } from '../../../providers/wallet'
import { submarineSwap } from '../../../lib/swaps'
import Error from '../../../components/Error'
import { extractError } from '../../../lib/error'
import Table from '../../../components/Table'
import NeedsPassword from '../../../components/NeedsPassword'
import { ECPairFactory } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { feesToSendSats } from '../../../lib/transactions'
import { getBalance } from '../../../lib/wallet'

export default function SendFees() {
  const { config } = useContext(ConfigContext)
  const { setMnemonic, wallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const [boltzFees, setBoltzFees] = useState(0)
  const [error, setError] = useState('')

  const { invoice, satoshis, total, txFees } = sendInfo
  const keys = ECPairFactory(ecc).makeRandom()
  const refundPublicKey = keys.publicKey.toString('hex')

  useEffect(() => {
    if (invoice && wallet.mnemonic) {
      submarineSwap(invoice, refundPublicKey, config)
        .then((swapResponse) => {
          const { expectedAmount } = swapResponse
          const txFees = feesToSendSats(expectedAmount, wallet)
          setBoltzFees(expectedAmount - satoshis)
          setSendInfo({ ...sendInfo, keys, swapResponse, txFees, total: expectedAmount + txFees })
        })
        .catch((error: any) => {
          console.log('error', error)
          setError(extractError(error))
        })
    }
  }, [invoice, wallet.mnemonic])

  useEffect(() => {
    if (sendInfo.total) {
      if (getBalance(wallet) < sendInfo.total) setError('Insufficient funds')
    }
  }, [sendInfo.total])

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handlePay = () => navigate(Pages.SendPayment)

  const label = error ? 'Something went wrong' : 'Pay'

  const data = [
    ['Invoice', prettyNumber(satoshis)],
    ['Boltz fees', prettyNumber(boltzFees)],
    ['Transaction fees', prettyNumber(txFees ?? 0)],
    ['Total', prettyNumber(total ?? 0)],
  ]

  if (!wallet.mnemonic) return <NeedsPassword onMnemonic={setMnemonic} />

  return (
    <Container>
      <Content>
        <Title text='Payment details' subtext='Values in sats' />
        {error ? <Error error={error} /> : <Table data={data} />}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePay} label={label} disabled={Boolean(error)} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
