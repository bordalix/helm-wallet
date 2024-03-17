import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Title from './Title'

interface BalanceProps {
  value: Satoshis
}

export default function Balance({ value }: BalanceProps) {
  const text = prettyNumber(value) + ' sats'
  const subtext = prettyNumber(fromSatoshis(value)) + ' BTC'
  return <Title text={text} subtext={subtext} />
}
