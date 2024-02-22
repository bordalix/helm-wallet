import { useContext } from 'react'
import LogoIcon from '../icons/Logo'
import SettingsIcon from '../icons/Settings'
import { ConfigContext } from '../providers/config'
import { NavigationContext, Pages } from '../providers/navigation'
import { WalletContext } from '../providers/wallet'

function Header() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { reloading } = useContext(WalletContext)

  console.log('reloading', reloading)

  return (
    <header className='mb-8'>
      <div className='flex justify-between w-full'>
        <button
          onClick={() => navigate(Pages.Wallet)}
          aria-label='Back to homepage'
          className={(reloading ? 'animate-pulse ' : '') + 'p-2 rounded-full bg-gray-100'}
        >
          <LogoIcon />
        </button>
        <button onClick={toggleShowConfig} className='p-2 rounded-full bg-gray-100'>
          <SettingsIcon />
        </button>
      </div>
    </header>
  )
}

export default Header
