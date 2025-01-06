import { useContext } from 'react'
import { fromSatoshis, prettyNumber } from '../lib/format'
import { Satoshis } from '../lib/types'
import Title from './Title'
import { FiatContext } from '../providers/fiat'
import { ConfigContext } from '../providers/config'
import { Unit, unitLabels } from '../lib/units'

interface BalanceProps {
  sats: Satoshis
}

export default function Balance({ sats }: BalanceProps) {
  const { config, updateConfig } = useContext(ConfigContext)
  const { toEuro, toUSD } = useContext(FiatContext)

  const satsWithUnit = {
    [Unit.BTC]: prettyNumber(fromSatoshis(sats), 8) + ' ' + unitLabels[Unit.BTC],
    [Unit.EUR]: prettyNumber(toEuro(sats), 2) + ' ' + unitLabels[Unit.EUR],
    [Unit.USD]: prettyNumber(toUSD(sats), 2) + ' ' + unitLabels[Unit.USD],
    [Unit.SAT]: prettyNumber(sats, 0) + ' ' + unitLabels[Unit.SAT],
  }

  const handleClick = () => {
    const { unit } = config
    if (unit === Unit.BTC) return updateConfig({ ...config, unit: Unit.EUR })
    if (unit === Unit.EUR) return updateConfig({ ...config, unit: Unit.USD })
    if (unit === Unit.USD) return updateConfig({ ...config, unit: Unit.BTC })
    if (unit === Unit.SAT) return updateConfig({ ...config, unit: Unit.BTC })
  }

  const text = satsWithUnit[Unit.SAT]
  const subtext = satsWithUnit[config.unit]

  return (
    <div className='cursor-pointer' onClick={handleClick}>
      <Title text={text} subtext={subtext} />
    </div>
  )
}
