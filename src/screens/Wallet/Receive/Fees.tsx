import { useContext } from 'react'
import Button from '../../../components/Button'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'
import { FlowContext, emptyRecvInfo } from '../../../providers/flow'
import { prettyNumber } from '../../../lib/format'
import Table from '../../../components/Table'
import { BoltzContext } from '../../../providers/boltz'

export default function ReceiveFees() {
  const { expectedFees } = useContext(BoltzContext)
  const { navigate } = useContext(NavigationContext)
  const { recvInfo, setRecvInfo } = useContext(FlowContext)

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  const handleContinue = () => navigate(Pages.ReceiveInvoice)

  const { amount } = recvInfo
  const { boltzFees, minerFees } = expectedFees(amount, 'recv')
  const total = amount - boltzFees - minerFees

  const data = [
    ['Amount', prettyNumber(amount)],
    ['Boltz fees', `- ${prettyNumber(boltzFees)}`],
    ['Miner fees', `- ${prettyNumber(minerFees)}`],
    ['You receive', prettyNumber(total)],
  ]

  return (
    <Container>
      <Content>
        <Title text='Expected fees' subtext={`You receive ${prettyNumber(total)} sats`} />
        <Table data={data} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleContinue} label='Continue' />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
