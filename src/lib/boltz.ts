import { NetworkName } from './network'

export const getBoltzApiUrl = (network: NetworkName) =>
  network === 'testnet' ? 'https://testnet.boltz.exchange/api' : 'https://api.boltz.exchange'

export const getBoltzWsUrl = (network: NetworkName) => `${getBoltzApiUrl(network).replace('https://', 'wss://')}/v2/ws`
