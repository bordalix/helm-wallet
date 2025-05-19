import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import { prettyNumber } from '../../../lib/format'
import { WalletContext } from '../../../providers/wallet'
import { submarineSwap } from '../../../lib/submarineSwap'
import Error from '../../../components/Error'
import { extractError } from '../../../lib/error'
import Table from '../../../components/Table'
import NeedsPassword from '../../../components/NeedsPassword'
import { ECPairFactory } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { getBalance } from '../../../lib/wallet'
import { feesToSendSats } from '../../../lib/fees'
import { getLiquidAddress } from '../../../lib/reverseSwap'
import Loading from '../../../components/Loading'
import { ConfigContext } from '../../../providers/config'
import { Unit, unitLabels } from '../../../lib/units'
import { hex } from '@scure/base'

export default function SendFees() {
  const { config } = useContext(ConfigContext)
  const { setMnemonic, wallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const [boltzFees, setBoltzFees] = useState(-1)
  const [error, setError] = useState('')

  const { address, invoice, magicHint, satoshis, total, txFees } = sendInfo
  const totalNeeded = (total ?? 0) + (txFees ?? 0)

  const keys = ECPairFactory(ecc).makeRandom()
  const refundPublicKey = hex.encode(keys.publicKey)

  useEffect(() => {
    if (wallet.mnemonic && satoshis) {
      if (address) {
        const txFees = feesToSendSats(satoshis, wallet)
        setBoltzFees(0)
        setSendInfo({ ...sendInfo, address, keys, txFees, total: satoshis })
        return
      }
      if (invoice) {
        if (magicHint) {
          const txFees = feesToSendSats(satoshis, wallet)
          setBoltzFees(0)
          getLiquidAddress(invoice, magicHint, config, wallet).then((address) => {
            setSendInfo({ ...sendInfo, address, keys, txFees })
          })
          return
        }
        submarineSwap(invoice, refundPublicKey, wallet.network, config)
          .then((swapResponse) => {
            const { expectedAmount } = swapResponse
            const txFees = feesToSendSats(expectedAmount, wallet)
            setBoltzFees(expectedAmount - satoshis)
            setSendInfo({ ...sendInfo, keys, swapResponse, txFees, total: expectedAmount })
          })
          .catch((error: any) => {
            setError(extractError(error))
          })
      }
    }
  }, [address, invoice, wallet.mnemonic])

  useEffect(() => {
    if (sendInfo.total) {
      if (getBalance(wallet) < totalNeeded)
        setError(`Insufficient funds, you just have ${prettyNumber(getBalance(wallet))} ${unitLabels[Unit.SAT]}`)
    }
  }, [sendInfo.total])

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handlePay = () => navigate(Pages.SendPayment)

  const label = error ? 'Something went wrong' : 'Pay'
  const prettyTotal = prettyNumber((total ?? 0) + (txFees ?? 0))

  const data = [
    ['Amount', prettyNumber(satoshis)],
    ['Boltz fees', prettyNumber(boltzFees)],
    ['Transaction fees', prettyNumber(txFees ?? 0)],
    ['Total', prettyTotal],
  ]

  if (!wallet.mnemonic) return <NeedsPassword onClose={handleCancel} onMnemonic={setMnemonic} />

  return (
    <Container>
      <Content>
        <Title text='Payment fees' subtext={`You pay ${prettyTotal} ${unitLabels[Unit.SAT]}`} />
        <div className='flex flex-col gap-2'>
          <Error error={Boolean(error)} text={error} />
          {boltzFees < 0 || !sendInfo.txFees ? <Loading text='Updating fees' /> : <Table data={data} />}
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePay} label={label} disabled={Boolean(error)} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
