import * as liquid from 'liquidjs-lib'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Payment } from 'liquidjs-lib/src/payments'
import { Wallet } from '../providers/wallet'
import { getNetwork } from './network'
import BIP32Factory from 'bip32'

const bip32 = BIP32Factory(ecc)

export const genAddress = (wallet: Wallet, index?: number, chain = 1): Payment => {
  const xpub = wallet.xpubs[wallet.network]
  const network = getNetwork(wallet.network)
  const nextIndex = index ?? wallet.nextIndex
  const pubkey = bip32.fromBase58(xpub).derive(chain).derive(nextIndex).publicKey
  return liquid.payments.p2wpkh({ network, pubkey })
}
