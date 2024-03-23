import { useContext, useEffect } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import NeedsPassword from '../../../components/NeedsPassword'
import LoadingIcon from '../../../icons/Loading'
import { prettyNumber } from '../../../lib/format'
import { WalletContext } from '../../../providers/wallet'
import { finalizeSubmarineSwap } from '../../../lib/submarineSwap'
import { timeToReload } from '../../../lib/constants'

export default function SendPayment() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { increaseIndex, reloadWallet, setMnemonic, wallet } = useContext(WalletContext)

  const { keys, total } = sendInfo
  if (!keys) return <></>

  const onTxid = (txid: string) => {
    increaseIndex()
    setSendInfo({ ...sendInfo, txid })
    setTimeout(() => reloadWallet(wallet), timeToReload)
    navigate(Pages.SendSuccess)
  }

  const goBackToWallet = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  useEffect(() => {
    if (wallet.mnemonic) {
      finalizeSubmarineSwap(sendInfo, wallet, onTxid)
    }
  }, [wallet.mnemonic])

  return (
    <Container>
      <Content>
        <Title text='Pay' subtext={`Paying ${prettyNumber(total ?? 0)} sats`} />
        <center className='mt-20'>{wallet.mnemonic ? <LoadingIcon /> : null}</center>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={goBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? '' : <NeedsPassword onClose={goBackToWallet} onMnemonic={setMnemonic} />}
    </Container>
  )
}
