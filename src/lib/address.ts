import BIP32Factory from 'bip32'
import { getNetwork } from './network'
import * as ecc from '@bitcoinerlab/secp256k1'
import * as liquid from 'liquidjs-lib'
import { BlindingKeyPair } from './blinder'
import { Wallet } from '../providers/wallet'
import { deriveBlindingKeys } from './wallet'

const bip32 = BIP32Factory(ecc)

export interface NewAddress {
  address: string
  blindingKeys: BlindingKeyPair
  confidentialAddress: string
  nextIndex: number
  pubkey: Buffer
  script: Buffer
}

/** derive a new address from xpub and nextIndex */
export const generateAddress = async (wallet: Wallet, index?: number): Promise<NewAddress> => {
  const chain = 0
  const xpub = wallet.xpubs[wallet.network]
  const network = getNetwork(wallet.network)
  const nextIndex = index ?? wallet.nextIndex[wallet.network]
  const pubkey = bip32.fromBase58(xpub).derive(chain).derive(nextIndex).publicKey
  const { address, output } = liquid.payments.p2wpkh({ network, pubkey })
  if (!address || !output) throw new Error('Unable to generate liquid payment')
  const script = output
  const unconfidentialAddress = liquid.address.fromOutputScript(script, network)
  const blindingKeys = await deriveBlindingKeys(script, wallet)
  const confidentialAddress = liquid.address.toConfidential(unconfidentialAddress, blindingKeys.publicKey)
  return { address, blindingKeys, confidentialAddress, nextIndex, pubkey, script }
}

/** generate a reversed sha256 of a script, to use with electrumx */
export const toScriptHash = (script: Buffer): string => {
  return liquid.crypto.sha256(script).reverse().toString('hex')
}
