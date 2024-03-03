import { mnemonicToSeed } from 'bip39'
import BIP32Factory from 'bip32'
import { Mnemonic, XPubs } from './types'
import { NetworkName } from './network'
import { Config } from '../providers/config'
import { ECPairFactory } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Wallet } from '../providers/wallet'

const bip32 = BIP32Factory(ecc)

const derivationPath = {
  [NetworkName.Liquid]: "m/84'/1776'/0'",
  [NetworkName.Regtest]: "m/84'/1'/0'",
  [NetworkName.Testnet]: "m/84'/1'/0'",
}

export const getKeys = async ({ network }: Config, { mnemonic }: Wallet) => {
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterNode = bip32.fromSeed(seed)
  const key = masterNode.derivePath(derivationPath[network].replace('m/', ''))
  return ECPairFactory(ecc).fromPrivateKey(key.privateKey!)
}

const getXpub = (seed: Buffer, network: NetworkName) =>
  bip32.fromSeed(seed).derivePath(derivationPath[network]).neutered().toBase58()

export const getXPubs = async (mnemonic: Mnemonic): Promise<XPubs> => {
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  return {
    [NetworkName.Liquid]: getXpub(seed, NetworkName.Liquid),
    [NetworkName.Regtest]: getXpub(seed, NetworkName.Regtest),
    [NetworkName.Testnet]: getXpub(seed, NetworkName.Testnet),
  }
}
