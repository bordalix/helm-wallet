import { NetworkName } from './network'

const liquidUrl = 'https://api.boltz.exchange'
const testnetUrl = 'https://testnet.boltz.exchange/api'
const onionUrl = 'http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api/'

export const getBoltzApiUrl = (network: NetworkName, tor = false) => {
  if (tor && network === NetworkName.Liquid) return onionUrl
  return network === NetworkName.Testnet ? testnetUrl : liquidUrl
}

export const getBoltzWsUrl = (network: NetworkName) =>
  `${getBoltzApiUrl(network, false).replace('https://', 'wss://')}/v2/ws`

export const getBoltzOnionUrl = () => onionUrl
