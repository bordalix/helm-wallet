import { ReactElement, useContext, useState } from 'react'
import Logout from './Logout'
import Explorer from './Explorer'
import Network from './Network'
import Header from './Header'
import Footer from '../../components/Footer'
import ExplorerIcon from '../../icons/Explorer'
import LogoutIcon from '../../icons/Logout'
import NetworkIcon from '../../icons/Network'
import ArrowIcon from '../../icons/Arrow'
import NotificationIcon from '../../icons/Notification'
import Notifications from './Notifications'
import { WalletContext } from '../../providers/wallet'
import Reload from './Reload'
import ReloadIcon from '../../icons/Reload'
import EncryptIcon from '../../icons/Encrypt'
import Backup from './Backup'
import BackupIcon from '../../icons/Backup'
import Password from './Password'

enum Options {
  Menu = 'menu',
  Backup = 'backup',
  Explorer = 'explorer',
  Logout = 'logout',
  Network = 'network',
  Notifications = 'notifications',
  Password = 'password',
  Reload = 'reload',
}

interface Option {
  icon: ReactElement
  option: Options
}

function Settings() {
  const { wallet } = useContext(WalletContext)

  const [option, setOption] = useState(Options.Menu)

  const hideBack = option === Options.Menu

  const options: Option[] = [
    {
      icon: <BackupIcon />,
      option: Options.Backup,
    },
    {
      icon: <ExplorerIcon />,
      option: Options.Explorer,
    },
    {
      icon: <NetworkIcon />,
      option: Options.Network,
    },
    {
      icon: <NotificationIcon />,
      option: Options.Notifications,
    },
    {
      icon: <EncryptIcon />,
      option: Options.Password,
    },
    {
      icon: <ReloadIcon />,
      option: Options.Reload,
    },
    {
      icon: <LogoutIcon />,
      option: Options.Logout,
    },
  ]

  const validOptions = (): Option[] => {
    if (wallet.mnemonic) return options
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
        {option === Options.Backup && <Backup />}
        {option === Options.Explorer && <Explorer />}
        {option === Options.Network && <Network />}
        {option === Options.Notifications && <Notifications />}
        {option === Options.Password && <Password />}
        {option === Options.Reload && <Reload />}
        {option === Options.Logout && <Logout />}
      </div>
      <Footer />
    </div>
  )
}

export default Settings
