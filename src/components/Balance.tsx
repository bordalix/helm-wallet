import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Subtitle from './Subtitle'
import Title from './Title'

interface Props {
  value: Satoshis
}

function Balance({ value }: Props) {
  return (
    <div>
      <Title text={prettyNumber(fromSatoshis(value)) + ' BTC'} />
      <Subtitle text={prettyNumber(value) + ' sats'} />
    </div>
  )
}

export default Balance
