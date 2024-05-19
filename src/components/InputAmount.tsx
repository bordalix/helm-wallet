import { useContext, useEffect, useState } from 'react'
import Columns from './Columns'
import Label from './Label'
import { fromSatoshis, prettyNumber, toSatoshis } from '../lib/format'
import { Unit } from '../providers/config'
import { FiatContext } from '../providers/fiat'

const unitLabels = {
  [Unit.SAT]: 'Sats',
  [Unit.BTC]: 'BTC',
  [Unit.EUR]: 'EUR',
  [Unit.USD]: 'USD',
}

interface InputAmountProps {
  label: string
  onChange: (arg0: any) => void
}

export default function InputAmount({ label, onChange }: InputAmountProps) {
  const { fromEuro, fromUSD, toEuro, toUSD } = useContext(FiatContext)

  const [amount, setAmount] = useState('')
  const [sats, setSats] = useState(0)
  const [unit, setUnit] = useState(Unit.SAT)
  const [lock, setLock] = useState(false)

  const nextUnit = () => {
    switch (unit) {
      case Unit.SAT:
        return Unit.BTC
      case Unit.BTC:
        return Unit.EUR
      case Unit.EUR:
        return Unit.USD
      case Unit.USD:
        return Unit.SAT
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<']

  useEffect(() => {
    if (lock) return setLock(false)
    const value =
      unit === Unit.SAT
        ? Number(amount)
        : unit === Unit.BTC
        ? toSatoshis(parseFloat(amount))
        : unit === Unit.EUR
        ? fromEuro(parseFloat(amount))
        : unit === Unit.USD
        ? fromUSD(parseFloat(amount))
        : 0
    setSats(Math.floor(value))
  }, [amount])

  useEffect(() => {
    onChange(sats)
  }, [sats])

  const className =
    'w-full p-3 pr-6 text-sm text-right font-semibold rounded-l-md -mr-4 bg-gray-100 dark:bg-gray-800 focus-visible:outline-none'

  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints // TODO

  const handleUnitChange = (unit: Unit) => {
    setLock(true)
    setAmount(
      sats === 0
        ? ''
        : unit === Unit.SAT
        ? String(sats)
        : unit === Unit.BTC
        ? prettyNumber(fromSatoshis(sats), 8)
        : unit === Unit.USD
        ? prettyNumber(toUSD(sats), 2)
        : prettyNumber(toEuro(sats), 2),
    )
    setUnit(unit)
  }

  const clickHandler = (key: string) => {
    if (amount === '' && key === '.') return setAmount('0.')
    if (amount === '' && key !== '<') return setAmount(key)
    if (key === '<') {
      const aux = amount.split('')
      return setAmount(aux.slice(0, aux.length - 1).join(''))
    }
    setAmount(amount + key)
  }

  const OtherAmounts = () => {
    const values = [
      [Unit.USD, prettyNumber(toUSD(sats), 2)],
      [Unit.EUR, prettyNumber(toEuro(sats), 2)],
      [Unit.SAT, prettyNumber(sats, 0)],
      [Unit.BTC, prettyNumber(fromSatoshis(sats), 8)],
    ].filter((row) => row[0] !== unit)
    const commonClassNames = 'text-xs mb-2 sm:mb-4 sm:mt-2 truncate'
    return (
      <Columns cols={3}>
        <p className={`${commonClassNames} text-left`} onClick={() => handleUnitChange(values[0][0] as Unit)}>
          {values[0][1]} {unitLabels[values[0][0] as Unit]}
        </p>
        <p className={`${commonClassNames} text-center`} onClick={() => handleUnitChange(values[1][0] as Unit)}>
          {values[1][1]} {unitLabels[values[1][0] as Unit]}
        </p>
        <p className={`${commonClassNames} text-right`} onClick={() => handleUnitChange(values[2][0] as Unit)}>
          {values[2][1]} {unitLabels[values[2][0] as Unit]}
        </p>
      </Columns>
    )
  }

  return (
    <fieldset className='text-left text-gray-800 dark:text-gray-100 w-full'>
      {label ? <Label text={label} /> : null}
      <div className='flex items-center h-12 rounded-l-md bg-gray-100 dark:bg-gray-800'>
        {isMobile ? (
          <p className={className}>{amount}</p>
        ) : (
          <input
            type='text'
            placeholder='0'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={className}
          />
        )}
        <div
          className='w-16 h-full flex items-center rounded-r-md cursor-pointer text-sm bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 border-gray-200 dark:border-gray-700'
          onClick={() => handleUnitChange(nextUnit())}
        >
          <div className='mx-auto font-semibold'>{unitLabels[unit]}</div>
        </div>
      </div>
      <div className='flex justify-between mb-4'>
        <OtherAmounts />
      </div>
      {isMobile ? (
        <Columns cols={3}>
          {keys.map((k) => (
            <p
              key={k}
              className='text-center p-3 sm:p-5 bg-gray-100 dark:bg-gray-800 select-none'
              onClick={() => clickHandler(k)}
            >
              {k}
            </p>
          ))}
        </Columns>
      ) : null}
    </fieldset>
  )
}
