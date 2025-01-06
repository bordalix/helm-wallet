/**
 * @jest-environment ./config/jest/uint8array-environment
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { validateMnemonic } from 'bip39'
import Wallet from '../screens/Wallet/Index'
import InitNew from '../screens/Init/New'
import InitOld from '../screens/Init/Restore'
import Settings from '../screens/Settings/Index'
import About from '../screens/Settings/About'
import Explorer from '../screens/Settings/Explorer'
import Network from '../screens/Settings/Network'
import Notifications from '../screens/Settings/Notifications'
import Pos from '../screens/Settings/Pos'
import Theme from '../screens/Settings/Theme'
import Tor from '../screens/Settings/Tor'
import ReceiveAmount from '../screens/Wallet/Receive/Amount'

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
    expect(screen.getByText(/Sats/)).toBeDefined()
    expect(screen.getByText(/BTC/)).toBeDefined()
    expect(screen.getByText(/Receive/)).toBeDefined()
    expect(screen.getByText(/Send/)).toBeDefined()
  })
})

describe('Receive', () => {
  test('amount and comment inputs are present', () => {
    render(<ReceiveAmount />)
    expect(screen.getAllByText(/Amount/)).toBeDefined()
    expect(screen.getByText(/Comment/)).toBeDefined()
    expect(screen.getByText(/Optional/)).toBeDefined()
    expect(document.querySelectorAll('input')?.length).toBe(2)
  })
})

describe('Settings', () => {
  test('menu has at least 7 options', () => {
    render(<Settings />)
    expect(document.querySelectorAll('.grow p').length).toBeGreaterThan(6)
  })
  test('about has some love', () => {
    render(<About />)
    expect(document.querySelectorAll('p')[2].innerHTML).toMatch('🧡')
  })
  test('explorer has 2 options', () => {
    render(<Explorer />)
    expect(document.querySelector('select')?.options.length).toBe(2)
  })
  test('network has 3 options', () => {
    render(<Network />)
    expect(document.querySelector('select')?.options.length).toBe(3)
  })
  test('notification has 2 options', () => {
    render(<Notifications />)
    expect(document.querySelector('select')?.options.length).toBe(2)
  })
  test('pos has 2 options', () => {
    render(<Pos />)
    expect(document.querySelector('select')?.options.length).toBe(2)
  })
  test('theme has 2 options', () => {
    render(<Theme />)
    expect(document.querySelector('select')?.options.length).toBe(2)
  })
  test('tor has 2 options', () => {
    render(<Tor />)
    expect(document.querySelector('select')?.options.length).toBe(2)
  })
})
