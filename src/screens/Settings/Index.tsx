import { ReactElement, useContext, useState } from 'react'
import Logout from './Logout'
import Explorer from './Explorer'
import Network from './Network'
import Header from './Header'
import Encrypt from './Encrypt'
import Footer from '../../components/Footer'
import { ConfigContext } from '../../providers/config'
import ExplorerIcon from '../../icons/Explorer'
import EncryptIcon from '../../icons/Encrypt'
import LogoutIcon from '../../icons/Logout'
import NetworkIcon from '../../icons/Network'
import ArrowIcon from '../../icons/Arrow'
import NotificationIcon from '../../icons/Notification'
import Notifications from './Notifications'

enum Options {
  Menu = 'menu',
  Encrypt = 'encrypt',
  Explorer = 'explorer',
  Logout = 'logout',
  Network = 'network',
  Notifications = 'notifications',
}

interface Option {
  icon: ReactElement
  option: Options
}

function Settings() {
  const { config } = useContext(ConfigContext)

  const [option, setOption] = useState(Options.Menu)

  const hideBack = option === Options.Menu

  const options: Option[] = [
    {
      icon: <ExplorerIcon />,
      option: Options.Explorer,
    },
    {
      icon: <NetworkIcon />,
      option: Options.Network,
    },
    {
      icon: <EncryptIcon />,
      option: Options.Encrypt,
    },
    {
      icon: <NotificationIcon />,
      option: Options.Notifications,
    },
    {
      icon: <LogoutIcon />,
      option: Options.Logout,
    },
  ]

  const validOptions = (): Option[] => {
    if (config.mnemonic) return options
    return options.filter((o) => o.option !== 'logout')
  }

  return (
    <div className='container h-full mx-auto py-4 flex flex-col'>
      <Header hideBack={hideBack} setOption={setOption} />
      <div className='grow'>
        {option === Options.Menu && (
          <div>
            {validOptions().map(({ icon, option }) => (
              <div
                className='flex justify-between cursor-pointer px-2.5 py-4 first:border-t-2 border-b-2'
                key={option}
                onClick={() => setOption(option)}
              >
                <div className='flex items-center'>
                  {icon}
                  <p className='ml-4 text-xl capitalize'>{option}</p>
                </div>
                <div>
                  <ArrowIcon />
                </div>
              </div>
            ))}
          </div>
        )}
        {option === Options.Explorer && <Explorer />}
        {option === Options.Network && <Network />}
        {option === Options.Logout && <Logout />}
        {option === Options.Encrypt && <Encrypt />}
        {option === Options.Notifications && <Notifications />}
      </div>
      <Footer />
    </div>
  )
}

export default Settings
