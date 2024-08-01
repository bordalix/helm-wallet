import { ReverseSwapResponse } from './reverseSwap'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import { readClaimsFromStorage, saveClaimsToStorage } from './storage'
import * as ecc from '@bitcoinerlab/secp256k1'

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

export const getClaims = () => {
  return readClaimsFromStorage().map((c) => ({
    ...c,
    keys: ECPairFactory(ecc).fromWIF(c.wif),
    preimage: Buffer.from(c.preimage, 'base64'),
  }))
}

export const removeClaim = (claim: ClaimInfo) => {
  saveClaimsToStorage(readClaimsFromStorage().filter((c) => c.createdResponse.id !== claim.createdResponse.id))
}

export const saveClaim = (claim: ClaimInfo) => {
  const claims = readClaimsFromStorage()
  if (claims.find((c) => c.createdResponse.id === claim.createdResponse.id)) {
    console.log('claim already in storage')
    return
  }
  const { createdResponse, destinationAddress } = claim
  claims.push({
    createdResponse,
    destinationAddress,
    preimage: claim.preimage.toString('base64'),
    wif: claim.keys.toWIF(),
  })
  saveClaimsToStorage(claims)
}
