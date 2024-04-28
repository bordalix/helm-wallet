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
import OuterContainer from '../../components/OuterContainer'
import ResetIcon from '../../icons/Reset'
import Reset from './Reset'
import InfoIcon from '../../icons/Info'
import About from './About'
import DarkThemeIcon from '../../icons/DarkTheme'
import Theme from './Theme'
import Tor from './Tor'
import TorIcon from '../../icons/Tor'

enum Options {
  Menu = 'menu',
  About = 'about',
  Backup = 'backup',
  Explorer = 'explorer',
  Logout = 'logout',
  Network = 'network',
  Notifications = 'notifications',
  Password = 'password',
  Reload = 'reload',
  Reset = 'reset',
  Theme = 'theme',
  Tor = 'tor',
}

interface Option {
  icon: ReactElement
  option: Options
}

export default function Settings() {
  const { wallet } = useContext(WalletContext)

  const [option, setOption] = useState(Options.Menu)

  const hideBack = option === Options.Menu

  const options: Option[] = [
    {
      icon: <InfoIcon />,
      option: Options.About,
    },
    {
      icon: <BackupIcon />,
      option: Options.Backup,
    },
    {
      icon: <ExplorerIcon />,
      option: Options.Explorer,
    },
    {
      icon: <LogoutIcon />,
      option: Options.Logout,
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
      icon: <ResetIcon />,
      option: Options.Reset,
    },
    {
      icon: <DarkThemeIcon />,
      option: Options.Theme,
    },
    {
      icon: <TorIcon />,
      option: Options.Tor,
    },
  ]

  const validOptions = (): Option[] => {
    if (wallet.initialized) return options
    const hiddenOptions = [Options.Backup, Options.Logout, Options.Password, Options.Reload, Options.Reset]
    return options.filter((o) => !hiddenOptions.includes(o.option))
  }

  return (
    <OuterContainer>
      <Header hideBack={hideBack} setOption={setOption} />
      <div className='grow'>
        {option === Options.Menu && (
          <div>
            {validOptions().map(({ icon, option }) => (
              <div
                className='flex justify-between cursor-pointer px-2.5 py-2.5 first:border-t-2 border-b-2 dark:border-gray-700'
                key={option}
                onClick={() => setOption(option)}
              >
                <div className='flex items-center'>
                  {icon}
                  <p className='ml-4 text-xl capitalize'>{option}</p>
                </div>
                <div className='flex items-center'>
                  <ArrowIcon />
                </div>
              </div>
            ))}
          </div>
        )}
        {option === Options.About && <About />}
        {option === Options.Backup && <Backup />}
        {option === Options.Explorer && <Explorer />}
        {option === Options.Logout && <Logout />}
        {option === Options.Network && <Network />}
        {option === Options.Notifications && <Notifications />}
        {option === Options.Password && <Password />}
        {option === Options.Reload && <Reload />}
        {option === Options.Reset && <Reset backup={() => setOption(Options.Backup)} />}
        {option === Options.Theme && <Theme />}
        {option === Options.Tor && <Tor />}
      </div>
      <Footer />
    </OuterContainer>
  )
}
