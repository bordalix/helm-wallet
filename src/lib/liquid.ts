import * as ecc from '@bitcoinerlab/secp256k1'
import { mnemonicToSeed } from 'bip39'
import BIP32Factory from 'bip32'
import { Mnemonic, Satoshis, XPubs } from './types'
import { NetworkName } from './network'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { getMasterBlindingKey } from './blinder'

const bip32 = BIP32Factory(ecc)

const derivationPath = {
  [NetworkName.Liquid]: "m/84'/1776'/0'",
  [NetworkName.Regtest]: "m/84'/1'/0'",
  [NetworkName.Testnet]: "m/84'/1'/0'",
}

const getXpub = (seed: Buffer, network: NetworkName) =>
  bip32.fromSeed(seed).derivePath(derivationPath[network]).neutered().toBase58()

export const getXPubsAndBlindingKey = async ({
  mnemonic,
}: Wallet): Promise<{ masterBlindingKey: string; xpubs: XPubs }> => {
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  return {
    masterBlindingKey: getMasterBlindingKey(seed),
    xpubs: {
      [NetworkName.Liquid]: getXpub(seed, NetworkName.Liquid),
      [NetworkName.Regtest]: getXpub(seed, NetworkName.Regtest),
      [NetworkName.Testnet]: getXpub(seed, NetworkName.Testnet),
    },
  }
}

export const balance = (config: Config, wallet: Wallet): Satoshis => {
  // fetchUnspents(config, wallet)
  return 21_000_000
}

export const selectUtxos = (mnemonic: Mnemonic, amount: Satoshis) => {}
