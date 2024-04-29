import { boltzOnionAddress } from './constants'
import { NetworkName } from './network'

const testnetUrl = 'https://testnet.boltz.exchange/api'
const liquiddUrl = 'https://api.boltz.exchange'

export const getBoltzApiUrl = (network: NetworkName, tor = false) => {
  if (tor && network === NetworkName.Liquid) return boltzOnionAddress
  return network === NetworkName.Testnet ? testnetUrl : liquiddUrl
}

export const getBoltzWsUrl = (network: NetworkName) =>
  `${getBoltzApiUrl(network, false).replace('https://', 'wss://')}/v2/ws`
