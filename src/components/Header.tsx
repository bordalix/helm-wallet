import { useContext } from 'react'
import LogoIcon from '../icons/Logo'
import SettingsIcon from '../icons/Settings'
import { ConfigContext } from '../providers/config'
import { NavigationContext, Pages } from '../providers/navigation'
import { WalletContext } from '../providers/wallet'
import { NetworkName } from '../lib/network'

const Testnet = () => (
  <div className='flex items-center'>
    <p className='border p-1 rounded-md uppercase text-sm'>Testnet</p>
  </div>
)

function Header() {
  const { config, toggleShowConfig } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { reloading, wallet } = useContext(WalletContext)

  const handleClick = () => navigate(wallet.initialized ? Pages.Wallet : Pages.Init)

  return (
    <header className='flex justify-between w-full mb-6'>
      <button
        onClick={handleClick}
        aria-label='Back to homepage'
        className={(reloading ? 'animate-pulse ' : '') + 'p-2 rounded-full bg-gray-100'}
      >
        <LogoIcon />
      </button>
      {config.network === NetworkName.Testnet ? <Testnet /> : null}
      <button onClick={toggleShowConfig} className='p-2 rounded-full bg-gray-100'>
        <SettingsIcon />
      </button>
    </header>
  )
}

export default Header
