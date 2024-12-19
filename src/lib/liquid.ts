import { address } from 'liquidjs-lib'
import { getNetwork, NetworkName } from './network'
import * as bs58check from 'bs58check'
import { Network } from 'liquidjs-lib/src/networks'

const fromBase58Check = (address: string): { hash: Uint8Array; version: number } => {
  const payload = bs58check.default.decode(address)
  const version = payload[0]
  const hash = payload.slice(1)
  return { hash, version }
}

const isBase58check = (addr: string, network: Network): boolean => {
  try {
    const { pubKeyHash, scriptHash } = network
    const { hash, version } = fromBase58Check(addr)
    return [20, 54].includes(hash.length) && [pubKeyHash, scriptHash, 4].includes(version)
  } catch {}
  return false
}

const isBech32 = (addr: string, network: Network): boolean => {
  try {
    const { data, prefix, version } = address.fromBech32(addr)
    return data.length === 20 && prefix === network.bech32 && version === 0
  } catch {}
  return false
}

const isBlech32 = (addr: string, network: Network): boolean => {
  const regexp = new RegExp(`^${network.blech32}`)
  if (!regexp.test(addr)) return false
  try {
    const { data, pubkey, version } = address.fromBlech32(addr)
    return data.length === 22 && pubkey.length === 33 && version === 0
  } catch {}
  return false
}

export const isLiquidAddress = (addr: string, net: NetworkName): boolean =>
  isBase58check(addr, getNetwork(net)) ||
  isBech32(addr.toLowerCase(), getNetwork(net)) ||
  isBlech32(addr.toLowerCase(), getNetwork(net))
