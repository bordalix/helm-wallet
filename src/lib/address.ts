import BIP32Factory from 'bip32'
import { getNetwork } from './network'
import * as ecc from '@bitcoinerlab/secp256k1'
import * as liquid from 'liquidjs-lib'
import { BlindingKeyPair } from './blinder'
import { Wallet } from '../providers/wallet'
import { deriveBlindingKey } from './wallet'

const bip32 = BIP32Factory(ecc)

export interface NewAddress {
  address: string
  blindingKeys: BlindingKeyPair
  confidentialAddress: string
  pubkey: Buffer
  script: Buffer
}

export const generateAddress = async (wallet: Wallet, index?: number, chain = 1): Promise<NewAddress> => {
  const xpub = wallet.xpubs[wallet.network]
  const network = getNetwork(wallet.network)
  const nextIndex = index ?? wallet.nextIndex
  const pubkey = bip32.fromBase58(xpub).derive(chain).derive(nextIndex).publicKey
  const { address, output } = liquid.payments.p2wpkh({ network, pubkey })
  if (!address || !output) throw new Error('Unable to generate liquid payment')
  const script = output
  const unconfidentialAddress = liquid.address.fromOutputScript(script, network)
  const blindingKeys = await deriveBlindingKey(script, wallet)
  const confidentialAddress = liquid.address.toConfidential(unconfidentialAddress, blindingKeys.publicKey)
  return { address, blindingKeys, confidentialAddress, pubkey, script }
}
