import { Network } from 'liquidjs-lib/src/networks'
import * as liquid from 'liquidjs-lib'

export enum NetworkName {
  Liquid = 'liquid',
  Testnet = 'testnet',
  Regtest = 'regtest',
}

export const networkNames: [NetworkName, string][] = [
  [NetworkName.Liquid, 'Liquid'],
  [NetworkName.Testnet, 'Testnet'],
  [NetworkName.Regtest, 'Regtest'],
]

export const getNetwork = (network: NetworkName): Network => {
  const net = network.toLowerCase()
  if (net === 'liquid') return liquid.networks.liquid
  if (net === 'testnet') return liquid.networks.testnet
  if (net === 'regtest') return liquid.networks.regtest
  throw new Error(`Invalid network ${network}`)
}
