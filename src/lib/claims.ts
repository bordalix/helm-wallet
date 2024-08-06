import { ReverseSwapResponse } from './reverseSwap'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import { readClaimsFromStorage, saveClaimsToStorage } from './storage'
import * as ecc from '@bitcoinerlab/secp256k1'
import { NetworkName } from './network'
import { ChainSource } from './chainsource'

export interface ClaimInfo {
  claimed: boolean
  claimTx: string
  createdResponse: ReverseSwapResponse
  destinationAddress: string
  lastStatus: string
  keys: ECPairInterface
  preimage: Buffer
}

export interface ClaimInfoStored {
  claimed: boolean
  claimTx: string
  createdResponse: ReverseSwapResponse
  destinationAddress: string
  lastStatus: string
  keys: string
  preimage: string
  wif: string
}

export type Claims = Record<NetworkName, ClaimInfoStored[]>

const infoToStored = (claim: ClaimInfo): ClaimInfoStored => ({
  ...claim,
  keys: '',
  preimage: claim.preimage.toString('base64'),
  wif: claim.keys.toWIF(),
})

const storedToInfo = (claim: ClaimInfoStored): ClaimInfo => ({
  ...claim,
  keys: ECPairFactory(ecc).fromWIF(claim.wif),
  preimage: Buffer.from(claim.preimage, 'base64'),
})

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

const getClaims = (network: NetworkName): ClaimInfo[] => {
  const claims = readClaimsFromStorage()
  if (!claims[network]) return []
  return claims[network].map((claim) => storedToInfo(claim))
}

export const getRetriableClaims = (network: NetworkName): ClaimInfo[] => {
  return getClaims(network).filter((claim) => !claim.claimed)
}

export const removeClaim = (claim: ClaimInfo, network: NetworkName): void => {
  const claims = readClaimsFromStorage()
  if (!claims[network]) return
  claims[network] = claims[network].filter((c) => c.createdResponse.id !== claim.createdResponse.id)
  saveClaimsToStorage(claims)
}

export const saveClaim = (claim: ClaimInfo, network: NetworkName): void => {
  console.log('saving claim', claim)
  const claims = readClaimsFromStorage()
  if (!claims[network]) claims[network] = []
  const claimStored = infoToStored(claim)
  const index = claims[network].findIndex((c) => c.createdResponse.id === claim.createdResponse.id)
  if (index === -1) claims[network].push(claimStored)
  else claims[network][index] = claimStored
  saveClaimsToStorage(claims)
}
