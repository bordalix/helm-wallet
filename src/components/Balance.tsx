import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Title from './Title'

interface BalanceProps {
  value: Satoshis
}

export default function Balance({ value }: BalanceProps) {
  return <Title text={prettyNumber(value) + ' sats'} subtext={prettyNumber(fromSatoshis(value)) + ' BTC'} />
}
