import { useContext } from 'react'
import BackIcon from '../../icons/Back'
import SettingsBlackIcon from '../../icons/SettingsBlack'
import { ConfigContext } from '../../providers/config'

function Header({ hideBack, setOption }: any) {
  const { toggleShowConfig } = useContext(ConfigContext)

  return (
    <header className='mb-4'>
      <div className='flex justify-between w-full'>
        {hideBack ? (
          <p />
        ) : (
          <button onClick={() => setOption('menu')} aria-label='Back' className='p-2 rounded-full bg-gray-100'>
            <BackIcon />
          </button>
        )}
        <button onClick={toggleShowConfig} className='p-2 rounded-full bg-gray-800'>
          <SettingsBlackIcon />
        </button>
      </div>
    </header>
  )
}

export default Header
