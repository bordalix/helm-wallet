import { useContext } from 'react'
import BackIcon from '../../icons/Back'
import SettingsBlackIcon from '../../icons/SettingsBlack'
import { ConfigContext } from '../../providers/config'
import { WalletContext } from '../../providers/wallet'

export default function Header({ hideBack, setOption }: any) {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { reloading } = useContext(WalletContext)

  return (
    <header className='mb-4'>
      <div className='flex justify-between w-full'>
        {hideBack ? (
          <p />
        ) : (
          <button
            onClick={() => setOption('menu')}
            aria-label='Back'
            className={(reloading ? 'animate-pulse ' : '') + 'p-2 rounded-full bg-gray-100'}
          >
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
