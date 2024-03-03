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
import { SubmarineSwapResponse, submarineSwap } from '../../../lib/boltz'
import Error from '../../../components/Error'
import { extractError } from '../../../lib/error'

const Row = ({ txt, val, last }: any) => (
  <tr className={last ? 'border-t-2' : ''}>
    <td className='p-2 text-left font-semibold'>{txt}</td>
    <td className='p-2 text-right'>{val}</td>
  </tr>
)

function SendFees() {
  const { config } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)
  const { navigate } = useContext(NavigationContext)
  const { sendInfo, setSendInfo } = useContext(FlowContext)

  const [boltzFees, setBoltzFees] = useState(0)
  const [error, setError] = useState('')

  const txFees = 200
  const { invoice, satoshis, total } = sendInfo

  useEffect(() => {
    if (invoice) {
      submarineSwap(invoice, config, wallet)
        .then((swapResponse: SubmarineSwapResponse) => {
          const { expectedAmount } = swapResponse
          setBoltzFees(expectedAmount - satoshis)
          setSendInfo({ ...sendInfo, swapResponse, total: expectedAmount + txFees })
        })
        .catch((error: any) => {
          setError(extractError(error))
        })
    }
  }, [invoice])

  const handleCancel = () => {
    setSendInfo(emptySendInfo)
    navigate(Pages.Wallet)
  }

  const handlePay = () => navigate(Pages.SendPayment)

  const label = error ? 'Something went wrong' : 'Pay'

  return (
    <Container>
      <Content>
        <Title text='Payment details' subtext='Values in sats' />
        <table className='w-full table-fixed mb-10'>
          <tbody>
            <Row txt='Invoice' val={prettyNumber(satoshis)} />
            <Row txt='Boltz fees' val={prettyNumber(boltzFees)} />
            <Row txt='Transaction fees' val={prettyNumber(txFees)} />
            <Row txt='Total' val={prettyNumber(total ?? 0)} last />
          </tbody>
        </table>
        {error ? <Error error={error} /> : null}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handlePay} label={label} disabled={Boolean(error)} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default SendFees
