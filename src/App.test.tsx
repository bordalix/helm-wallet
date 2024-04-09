/**
 * @jest-environment ./config/jest/uint8array-environment
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { validateMnemonic } from 'bip39'
import Wallet from './screens/Wallet/Index'
import InitNew from './screens/Init/New'
import InitOld from './screens/Init/Restore'
import Settings from './screens/Settings/Index'

const mnemonics = {
  invalid: 'egg egg egg egg egg egg egg egg egg egg egg egg',
  valid: 'all all all all all all all all all all all all',
}

describe('New wallet', () => {
  test('has title and buttons', () => {
    render(<InitNew />)
    expect(screen.getByText(/Your new wallet/)).toBeDefined()
    expect(screen.getByText(/Write down the following words/)).toBeDefined()
    expect(screen.getByText(/Continue/)).toBeDefined()
    expect(screen.getByText(/Cancel/)).toBeDefined()
    document.querySelectorAll('fieldset p').forEach((p) => {
      expect(p.textContent?.length).toBeGreaterThan(0)
    })
  })

  test('has mnemonic', () => {
    render(<InitNew />)
    document.querySelectorAll('fieldset p').forEach((p) => {
      expect(p.textContent?.length).toBeGreaterThan(0)
    })
  })
})

describe('Restore wallet', () => {
  test('has title and buttons', async () => {
    render(<InitOld />)
    expect(screen.getByText(/Restore wallet/)).toBeDefined()
    expect(screen.getByText(/Insert your secret words/)).toBeDefined()
    expect(screen.getByText(/Incomplete mnemonic/)).toBeDefined()
    expect(screen.getByText(/Cancel/)).toBeDefined()
  })

  test('mnemonic is invalid', async () => {
    render(<InitOld />)
    document.querySelectorAll('fieldset input').forEach((input, idx) => {
      fireEvent.change(input, { target: { value: mnemonics.invalid.split(' ')[idx] } })
    })
    expect(validateMnemonic(mnemonics.invalid)).toBeFalsy()
    expect(screen.getAllByText(/Invalid mnemonic/)).toBeDefined()
  })

  test('mnemonic is valid', async () => {
    render(<InitOld />)
    document.querySelectorAll('fieldset input').forEach((input, idx) => {
      fireEvent.change(input, { target: { value: mnemonics.valid.split(' ')[idx] } })
    })
    expect(validateMnemonic(mnemonics.valid)).toBeTruthy()
    expect(screen.getByText(/Continue/)).toBeDefined()
  })
})

describe('Wallet', () => {
  test('has balance and buttons', () => {
    render(<Wallet />)
    expect(screen.getByText(/sats/)).toBeDefined()
    expect(screen.getByText(/BTC/)).toBeDefined()
    expect(screen.getByText(/Receive/)).toBeDefined()
    expect(screen.getByText(/Send/)).toBeDefined()
  })
})

describe('Settings', () => {
  test('has at least 8 options', () => {
    render(<Settings />)
    expect(document.querySelectorAll('.grow p').length).toBeGreaterThan(7)
  })
})
