import { ReverseSwapResponse } from './reverseSwap'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import { readClaimsFromStorage, saveClaimsToStorage } from './storage'
import * as ecc from '@bitcoinerlab/secp256k1'
import { NetworkName } from './network'
import { ChainSource } from './chainsource'

export interface ClaimInfo {
  createdResponse: ReverseSwapResponse
  destinationAddress: string
  preimage: Buffer
  keys: ECPairInterface
}

export interface ClaimInfoStored {
  createdResponse: ReverseSwapResponse
  destinationAddress: string
  preimage: string
  wif: string
}

export type Claims = Record<NetworkName, ClaimInfoStored[]>

export const deleteExpiredClaims = (chainSource: ChainSource, network: NetworkName): void => {
  const claims = getClaims(network)
  if (claims.length > 0) {
    chainSource.fetchChainTip().then((tip) => {
      for (const claim of claims) {
        const expired = claim.createdResponse.timeoutBlockHeight <= tip
        if (expired) removeClaim(claim, network)
      }
    })
  }
}

export const getClaims = (network: NetworkName): ClaimInfo[] => {
  const claims = readClaimsFromStorage()
  if (!claims[network]) return []
  return claims[network].map((c) => ({
    ...c,
    keys: ECPairFactory(ecc).fromWIF(c.wif),
    preimage: Buffer.from(c.preimage, 'base64'),
  }))
}

export const removeClaim = (claim: ClaimInfo, network: NetworkName) => {
  const claims = readClaimsFromStorage()
  if (!claims[network]) return []
  claims[network] = claims[network].filter((c) => c.createdResponse.id !== claim.createdResponse.id)
  saveClaimsToStorage(claims)
}

export const saveClaim = (claim: ClaimInfo, network: NetworkName) => {
  const claims = readClaimsFromStorage()
  if (!claims[network]) claims[network] = []
  if (claims[network].find((c) => c.createdResponse.id === claim.createdResponse.id)) return

  const { createdResponse, destinationAddress } = claim

  claims[network].push({
    createdResponse,
    destinationAddress,
    preimage: claim.preimage.toString('base64'),
    wif: claim.keys.toWIF(),
  })

  saveClaimsToStorage(claims)
}
