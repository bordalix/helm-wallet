import { useContext } from 'react'
import Button from '../../../components/Button'
import Title from '../../../components/Title'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Container from '../../../components/Container'
import { FlowContext, emptySendInfo } from '../../../providers/flow'
import { prettyNumber } from '../../../lib/format'

const Row = ({ txt, val, last }: any) => (
  <tr className={last ? 'border-t-2' : ''}>
    <td className='p-2 text-left font-semibold'>{txt}</td>
    <td className='p-2 text-right'>{val}</td>
  </tr>
)

function SendFees() {
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handlePay = () => navigate(Pages.SendPayment)

  const { boltzFees, satoshis, total, txFees } = sendInfo

  return (
    <Container>
      <Content>
        <Title text='Payment details' subtext='Values in sats' />
        <table className='w-full table-fixed'>
          <tbody>
            <Row txt='Invoice' val={prettyNumber(satoshis)} />
            <Row txt='Boltz fees' val={prettyNumber(boltzFees)} />
            <Row txt='Transaction fees' val={prettyNumber(txFees)} />
            <Row txt='Total' val={prettyNumber(total)} last />
          </tbody>
        </table>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePay} label='Pay' />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default SendFees
