import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ConfigProvider } from './providers/config'
import { NavigationProvider } from './providers/navigation'
import { FlowProvider } from './providers/flow'
import { WalletProvider } from './providers/wallet'
import { BoltzProvider } from './providers/boltz'
import { FiatProvider } from './providers/fiat'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  // <React.StrictMode>
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
  </NavigationProvider>,
  // </React.StrictMode>,
)
