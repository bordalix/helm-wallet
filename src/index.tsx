import './index.css'
import App from './App'
import ReactDOM from 'react-dom/client'
import { BoltzProvider } from './providers/boltz'
import { ConfigProvider } from './providers/config'
import { ConnectionProvider } from './providers/connection'
import { FiatProvider } from './providers/fiat'
import { FlowProvider } from './providers/flow'
import { NavigationProvider } from './providers/navigation'
import { WalletProvider } from './providers/wallet'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  // <React.StrictMode>
  <ConnectionProvider>
    <NavigationProvider>
      <ConfigProvider>
        <FiatProvider>
          <WalletProvider>
            <BoltzProvider>
              <FlowProvider>
                <App />
              </FlowProvider>
            </BoltzProvider>
          </WalletProvider>
        </FiatProvider>
      </ConfigProvider>
    </NavigationProvider>
  </ConnectionProvider>,
  // </React.StrictMode>,
)
