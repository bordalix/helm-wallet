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
  ]

  const validOptions = (): Option[] => {
    if (wallet.initialized) return options
    return options.filter((o) => o.option !== 'logout')
  }

  return (
    <OuterContainer>
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
        {option === Options.About && <About />}
        {option === Options.Backup && <Backup />}
        {option === Options.Explorer && <Explorer />}
        {option === Options.Logout && <Logout />}
        {option === Options.Network && <Network />}
        {option === Options.Notifications && <Notifications />}
        {option === Options.Password && <Password />}
        {option === Options.Reload && <Reload />}
        {option === Options.Reset && <Reset backup={() => setOption(Options.Backup)} />}
      </div>
      <Footer />
    </OuterContainer>
  )
}

export default Settings
