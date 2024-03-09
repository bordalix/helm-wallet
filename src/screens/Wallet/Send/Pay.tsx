import { useContext, useEffect, useState } from 'react'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import Container from '../../../components/Container'
import NeedsPassword from '../../../components/NeedsPassword'
import LoadingIcon from '../../../icons/Loading'
import Columns from '../../../components/Columns'
import { prettyNumber } from '../../../lib/format'
import { WalletContext } from '../../../providers/wallet'
import { ConfigContext } from '../../../providers/config'
import { finalizeSubmarineSwap } from '../../../lib/swaps'

const steps = ['Authorize', 'Broadcast', 'Finalize']

const Step = ({ num, step }: any) => {
  const specialClass = step > num ? 'bg-black text-white' : step === num ? 'animate-pulse bg-gray-300' : 'bg-white'
  const className = 'rounded-md ' + specialClass
  return <p className={className}>{steps[num]}</p>
}

function SendPayment() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { setMnemonic, wallet } = useContext(WalletContext)

  const [step, setStep] = useState(0)

  const { invoice, swapResponse, total } = sendInfo

  const onFinish = (txid: string) => {
    setSendInfo({ ...sendInfo, txid })
    navigate(Pages.SendSuccess)
  }

  const goBackToWallet = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  useEffect(() => {
    if (wallet.mnemonic) {
      setStep(1)
      setTimeout(() => setStep(2), 3_000)
      setTimeout(() => setStep(3), 6_000)
      finalizeSubmarineSwap(invoice, swapResponse, config, wallet, onFinish)
    }
  }, [wallet.mnemonic])

  const showLoadingIcon = step > 0

  return (
    <Container>
      <Content>
        <Title text='Pay' subtext={`Paying ${prettyNumber(total ?? 0)} sats`} />
        <Columns cols={3}>
          <Step num={0} step={step} />
          <Step num={1} step={step} />
          <Step num={2} step={step} />
        </Columns>
        <center className='mt-20'>{showLoadingIcon ? <LoadingIcon /> : null}</center>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={goBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? '' : <NeedsPassword onClose={goBackToWallet} onMnemonic={setMnemonic} />}
    </Container>
  )
}

export default SendPayment
