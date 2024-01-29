import { useContext } from 'react'
import LogoIcon from '../icons/Logo'
import SettingsIcon from '../icons/Settings'
import { ConfigContext } from '../providers/config'
import { NavigationContext, Pages } from '../providers/navigation'

function Header() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)

  return (
    <header className='mb-2'>
      <div className='flex justify-between w-full'>
        <button
          onClick={() => navigate(Pages.Wallet)}
          aria-label='Back to homepage'
          className='p-2 rounded-full bg-gray-100'>
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
