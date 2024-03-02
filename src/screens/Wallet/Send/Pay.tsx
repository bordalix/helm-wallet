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
import SuccessIcon from '../../../icons/Success'
import { prettyNumber } from '../../../lib/format'
import { WalletContext } from '../../../providers/wallet'
import { ConfigContext } from '../../../providers/config'
import { getExplorerURL } from '../../../lib/explorers'

const Step = ({ num, step, text }: any) => {
  const specialClass = step > num ? 'bg-black text-white' : step === num ? 'animate-pulse bg-gray-300' : 'bg-white'
  const className = 'rounded-md ' + specialClass
  return <p className={className}>{text}</p>
}

function SendPayment() {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { setMnemonic, wallet } = useContext(WalletContext)

  const [step, setStep] = useState(1)

  const handleBackToWallet = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handleExplorer = () => window.open(getExplorerURL(config), '_blank', 'noreferrer')

  const handleMnemonic = (mnemonic: string) => {
    console.log(mnemonic)
    setStep(2)
    setTimeout(() => setStep(3), 3_000)
    setTimeout(() => setStep(4), 6_000)
    setMnemonic(mnemonic)
  }

  useEffect(() => {
    if (wallet.mnemonic) handleMnemonic(wallet.mnemonic)
  }, [wallet.mnemonic])

  const showLoadingIcon = step > 1 && step < 4
  const showSuccessIcon = step === 4
  const { total } = sendInfo

  return (
    <Container>
      <Content>
        <Title text='Pay' subtext={`Paying ${prettyNumber(total)} sats`} />
        <Columns cols={3}>
          <Step num={1} step={step} text='Authorise' />
          <Step num={2} step={step} text='Broadcast' />
          <Step num={3} step={step} text='Receive' />
        </Columns>
        <center className='mt-20'>
          {showLoadingIcon ? <LoadingIcon /> : null}
          {showSuccessIcon ? <SuccessIcon /> : null}
        </center>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleExplorer} label='View on explorer' />
        <Button onClick={handleBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      {wallet.mnemonic ? '' : <NeedsPassword onClose={handleBackToWallet} onMnemonic={handleMnemonic} />}
    </Container>
  )
}

export default SendPayment
