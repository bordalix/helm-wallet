import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Title from './Title'

interface BalanceProps {
  value: Satoshis
}

function Balance({ value }: BalanceProps) {
  return (
    <div>
      <Title text={prettyNumber(fromSatoshis(value)) + ' BTC'} subtext={prettyNumber(value) + ' sats'} />
    </div>
  )
}

export default Balance
