import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Title from './Title'

interface BalanceProps {
  value: Satoshis
}

function Balance({ value }: BalanceProps) {
  return <Title text={prettyNumber(fromSatoshis(value)) + ' BTC'} subtext={prettyNumber(value) + ' sats'} />
}

export default Balance
