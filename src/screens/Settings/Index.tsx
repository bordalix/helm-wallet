import { ReactElement, useContext, useState } from 'react'
import { WalletContext } from '../../providers/wallet'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import OuterContainer from '../../components/OuterContainer'
import Toast from '../../components/Toast'
import ExplorerIcon from '../../icons/Explorer'
import LogoutIcon from '../../icons/Logout'
import NetworkIcon from '../../icons/Network'
import ArrowIcon from '../../icons/Arrow'
import NotificationIcon from '../../icons/Notification'
import ReloadIcon from '../../icons/Reload'
import BackupIcon from '../../icons/Backup'
import InfoIcon from '../../icons/Info'
import PosIcon from '../../icons/Pos'
import ResetIcon from '../../icons/Reset'
import PasswordIcon from '../../icons/Password'
import DarkThemeIcon from '../../icons/DarkTheme'
import TorIcon from '../../icons/Tor'
import Logout from './Logout'
import Explorer from './Explorer'
import Network from './Network'
import Notifications from './Notifications'
import Reload from './Reload'
import Backup from './Backup'
import Password from './Password'
import Reset from './Reset'
import About from './About'
import Theme from './Theme'
import Tor from './Tor'
import Pos from './Pos'
import Logs from './Logs'
import MagnifyIcon from '../../icons/Magnify'

enum Options {
  Menu = 'menu',
  About = 'about',
  Backup = 'backup',
  Explorer = 'explorer',
  Logout = 'logout',
  Logs = 'logs',
  Network = 'network',
  Notifications = 'notifications',
  Password = 'password',
  Pos = 'PoS',
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

  const showBack = option !== Options.Menu

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
      icon: <MagnifyIcon />,
      option: Options.Logs,
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
      icon: <PasswordIcon />,
      option: Options.Password,
    },
    {
      icon: <PosIcon />,
      option: Options.Pos,
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
      <Toast />
      <Header showBack={showBack} setOption={setOption} />
      <div className='grow'>
        {option === Options.Menu && (
          <div>
            {validOptions().map(({ icon, option }) => (
              <div
                className='flex justify-between cursor-pointer px-2.5 py-1.5 tall:py-2 first:border-t-1 border-b-1 border-gray-200 dark:border-gray-700'
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
        {option === Options.Logs && <Logs />}
        {option === Options.Network && <Network />}
        {option === Options.Notifications && <Notifications />}
        {option === Options.Password && <Password />}
        {option === Options.Pos && <Pos />}
        {option === Options.Reload && <Reload />}
        {option === Options.Reset && <Reset backup={() => setOption(Options.Backup)} />}
        {option === Options.Theme && <Theme />}
        {option === Options.Tor && <Tor />}
      </div>
      <Footer />
    </OuterContainer>
  )
}
