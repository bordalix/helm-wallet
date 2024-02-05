import * as liquid from 'liquidjs-lib'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Payment } from 'liquidjs-lib/src/payments'
import { Wallet } from '../providers/wallet'
import { deriveBlindingKey } from './blinder'
import { getNetwork } from './network'
import BIP32Factory from 'bip32'

const bip32 = BIP32Factory(ecc)

export const genAddress = (wallet: Wallet, index: number, chain = 1): Payment => {
  const xpub = wallet.xpubs[wallet.network]
  const network = getNetwork(wallet.network)
  const nextIndex = index ?? wallet.nextIndex
  const pubkey = bip32.fromBase58(xpub).derive(chain).derive(nextIndex).publicKey
  return liquid.payments.p2wpkh({ network, pubkey })
}

export const genConfidentialAddress = (wallet: Wallet, index: number): Payment => {
  const { output, pubkey } = genAddress(wallet, index)
  if (!output || !pubkey) throw new Error('Could not derive output script')
  const blindkey = deriveBlindingKey(wallet.masterBlindingKey, output)
  if (!blindkey) throw new Error('Could not derive blinding key')
  const payment = liquid.payments.p2wpkh({
    blindkey: blindkey.publicKey,
    network: getNetwork(wallet.network),
    output,
  })
  if (!payment.address || !payment.confidentialAddress) throw new Error('Could not generate address')
  return payment
}
