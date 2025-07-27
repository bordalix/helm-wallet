import { useContext } from 'react'
import { ConfigContext } from '../providers/config'
import { ConnectionContext } from '../providers/connection'
import { NavigationContext, Pages } from '../providers/navigation'
import { WalletContext } from '../providers/wallet'
import { NetworkName } from '../lib/network'
import BackIcon from '../icons/Back'
import LogoIcon from '../icons/Logo'
import SettingsIcon from '../icons/Settings'
import SettingsBlackIcon from '../icons/SettingsBlack'

const Offline = () => (
  <div className='flex items-center'>
    <p className='bg-red-500  border-red-500 text-white px-1 rounded-md uppercase text-xxs font-semibold'>Offline</p>
  </div>
)

const Testnet = () => (
  <div className='flex items-center'>
    <p className='bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 px-1 rounded-md uppercase text-xxs font-semibold'>
      Testnet
    </p>
  </div>
)

const Tor = () => (
  <div className='flex items-center'>
    <p className='bg-violet-600  border-violet-600 text-white px-1 rounded-md uppercase text-xxs font-semibold'>Tor</p>
  </div>
)

export default function Header({ showBack, setOption }: any) {
  const { config, showConfig, toggleShowConfig } = useContext(ConfigContext)
  const { offline } = useContext(ConnectionContext)
  const { navigate } = useContext(NavigationContext)
  const { reloading, wallet } = useContext(WalletContext)

  const handleClick = () => navigate(wallet.initialized ? Pages.Wallet : Pages.Init)
  const handleBack = () => setOption('menu')

  const className = 'cursor-pointer p-2 rounded-full bg-gray-100 dark:bg-gray-800'
  const pulse = reloading ? 'animate-pulse ' : ''

  const EmptyButton = () => <div className='w-12' />

  const LogoButton = () => (
    <button onClick={handleClick} aria-label='Home' className={pulse + className}>
      <LogoIcon />
    </button>
  )

  const BackButton = () => (
    <button onClick={handleBack} aria-label='Back' className={pulse + className}>
      <BackIcon />
    </button>
  )

  const LeftButton = () => (showBack ? <BackButton /> : showConfig ? <EmptyButton /> : <LogoButton />)

  const RightButton = () =>
    showConfig ? (
      <button onClick={toggleShowConfig} className='p-2 rounded-full bg-gray-800 dark:bg-gray-100'>
        <SettingsBlackIcon />
      </button>
    ) : (
      <button onClick={toggleShowConfig} className={className}>
        <SettingsIcon />
      </button>
    )

  const Pills = () => (
    <div className='flex gap-2'>
      {wallet.network === NetworkName.Testnet ? <Testnet /> : null}
      {wallet.network === NetworkName.Liquid && config.tor ? <Tor /> : null}
      {offline ? <Offline /> : null}
    </div>
  )

  return (
    <header className='flex justify-between w-full mb-3'>
      <LeftButton />
      <Pills />
      <RightButton />
    </header>
  )
}
