import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import NeedsPassword from '../../../components/NeedsPassword'
import { prettyNumber } from '../../../lib/format'
import { WalletContext } from '../../../providers/wallet'
import { finalizeSubmarineSwap } from '../../../lib/submarineSwap'
import { inOneMinute, someSeconds } from '../../../lib/constants'
import { sendSats } from '../../../lib/transactions'
import Error from '../../../components/Error'
import Loading from '../../../components/Loading'
import { ConfigContext } from '../../../providers/config'
import { unitLabels, Unit } from '../../../lib/units'
import { BoltzContext } from '../../../providers/boltz'

export default function SendPayment() {
  const { limits } = useContext(BoltzContext)
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { increaseIndex, reloadWallet, setMnemonic, wallet } = useContext(WalletContext)

  const [error, setError] = useState('')

  const { invoice, keys, total } = sendInfo
  if (invoice && !keys) return <Error error text='Missing keys' />

  const onTxid = (txid: string) => {
    if (!txid) return setError('Error broadcasting transaction')
    increaseIndex()
    setSendInfo({ ...sendInfo, txid })
    setTimeout(() => reloadWallet(wallet), someSeconds)
    setTimeout(() => reloadWallet(wallet), inOneMinute)
    navigate(Pages.SendSuccess)
  }

  const goBackToWallet = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  useEffect(() => {
    if (wallet.mnemonic) {
      if (sendInfo.address && sendInfo.total) {
        sendSats(sendInfo.total, sendInfo.address, wallet, config).then((txid) => onTxid(txid))
      } else if (sendInfo.invoice) {
        finalizeSubmarineSwap(sendInfo, config, wallet, onTxid)
      }
    }
  }, [wallet.mnemonic])

  const loadingText =
    sendInfo.total && sendInfo.total > limits.send.maximalZeroConf
      ? 'Large amounts can take up to a minute to complete'
      : ''

  return (
    <Container>
      <Content>
        <Title text='Pay' subtext={`Paying ${prettyNumber(total ?? 0)} ${unitLabels[Unit.SAT]}`} />
        {error ? (
          <Error error={Boolean(error)} text={error} />
        ) : wallet.mnemonic ? (
          <Loading text={loadingText} />
        ) : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={goBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? '' : <NeedsPassword onClose={goBackToWallet} onMnemonic={setMnemonic} />}
    </Container>
  )
}
