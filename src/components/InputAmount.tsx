import { useContext, useEffect, useState } from 'react'
import { fromSatoshis, prettyNumber } from '../lib/format'
import { nextUnit, satsFromUnit, satsToUnit, Unit, unitLabels } from '../lib/units'
import { FiatContext } from '../providers/fiat'
import { Satoshis } from '../lib/types'
import Keyboard from './Keyboard'
import Columns from './Columns'
import Label from './Label'

interface InputAmountProps {
  sats: Satoshis
  setSats: (arg0: Satoshis) => void
}

export default function InputAmount({ sats, setSats }: InputAmountProps) {
  const { fromEuro, fromUSD, toEuro, toUSD } = useContext(FiatContext)

  const [lock, setLock] = useState(false)
  const [text, setText] = useState('')
  const [unit, setUnit] = useState(Unit.SAT)

  useEffect(() => {
    if (text || !sats) return
    setText(String(satsToUnit(sats, unit, toEuro, toUSD)))
  }, [sats])

  useEffect(() => {
    if (lock) return setLock(false)
    setSats(text ? satsFromUnit(Number(text), unit, fromEuro, fromUSD) : 0)
  }, [text])

  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints // TODO

  const inputClassName =
    'w-full p-3 pr-6 text-sm text-right font-semibold rounded-l-md -mr-4 bg-gray-100 dark:bg-gray-800 focus-visible:outline-none'

  const handleInputChange = (ev: any) => {
    setText(ev.target.value)
  }

  const handleKeyboardClick = (key: string) => {
    if (text === '' && key === '.') return setText('0.')
    if (text === '' && key === '<') return setText('')
    if (key === '<') return setText(text.slice(0, -1))
    setText(text + key)
  }

  const handleUnitChange = (unit: Unit) => {
    setLock(true)
    setText(
      !sats
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

  const OtherAmounts = () => {
    const values = [
      [Unit.USD, prettyNumber(toUSD(sats), 2)],
      [Unit.EUR, prettyNumber(toEuro(sats), 2)],
      [Unit.SAT, prettyNumber(sats, 0)],
      [Unit.BTC, prettyNumber(fromSatoshis(sats), 8)],
    ].filter((row) => row[0] !== unit)

    const commonClassNames = 'text-xs my-1 truncate'

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
      <Label text='Amount' />
      <div className='flex items-center h-12 rounded-l-md bg-gray-100 dark:bg-gray-800'>
        {isMobile ? (
          <p className={inputClassName}>{text}</p>
        ) : (
          <input type='text' value={text} onChange={handleInputChange} className={inputClassName} />
        )}
        <div
          className='w-16 h-full flex items-center rounded-r-md cursor-pointer text-sm bg-gray-800 dark:bg-gray-100 text-gray-100 dark:text-gray-800 border-gray-200 dark:border-gray-700'
          onClick={() => handleUnitChange(nextUnit(unit))}
        >
          <div className='mx-auto font-semibold'>{unitLabels[unit]}</div>
        </div>
      </div>
      <div className='flex justify-between'>
        <OtherAmounts />
      </div>
      {isMobile ? (
        <div className='mb-3'>
          <Keyboard onClick={handleKeyboardClick} />
        </div>
      ) : (
        <div className='mb-10' />
      )}
    </fieldset>
  )
}
