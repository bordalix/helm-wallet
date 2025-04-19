import { mnemonicToSeed } from 'bip39'
import BIP32Factory from 'bip32'
import { Mnemonic, Satoshis, Utxo, XPubs } from './types'
import { NetworkName } from './network'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Wallet } from '../providers/wallet'
import * as liquid from 'liquidjs-lib'
import { SLIP77Factory } from 'slip77'
import { BlindingKeyPair } from './blinder'
import { hex } from '@scure/base'

const bip32 = BIP32Factory(ecc)
const slip77 = SLIP77Factory(ecc)

const derivationPath = {
  [NetworkName.Liquid]: "m/84'/1776'/0'",
  [NetworkName.Regtest]: "m/84'/1'/0'",
  [NetworkName.Testnet]: "m/84'/1'/0'",
}

export const gapLimits = [5, 20, 40, 80]

export const getMnemonicKeys = async ({ mnemonic, network }: Wallet): Promise<ECPairInterface> => {
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterNode = bip32.fromSeed(seed)
  const key = masterNode.derivePath(derivationPath[network].replace('m/', ''))
  return ECPairFactory(ecc).fromPrivateKey(key.privateKey!)
}

export const getCoinKeys = async (coin: Utxo, wallet: Wallet): Promise<ECPairInterface> => {
  const { mnemonic, network } = wallet
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterNode = bip32.fromSeed(seed)
  const key = masterNode.derivePath(derivationPath[network].replace('m/', '')).derive(0).derive(coin.nextIndex)
  return ECPairFactory(ecc).fromPrivateKey(key.privateKey!)
}

export const generateRandomKeys = (net: NetworkName): ECPairInterface => {
  const network = liquid.networks[net]
  return ECPairFactory(ecc).makeRandom({ network })
}

const getXpub = (seed: Buffer, network: NetworkName) => {
  return bip32.fromSeed(seed).derivePath(derivationPath[network]).neutered().toBase58()
}

export const getMasterKeys = async (mnemonic: Mnemonic): Promise<{ masterBlindingKey: string; xpubs: XPubs }> => {
  const slip77 = SLIP77Factory(ecc)
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterBlindingKey = hex.encode(slip77.fromSeed(hex.encode(seed)).masterKey)
  if (!masterBlindingKey) throw new Error('Could not get masterBlindingKey')
  return {
    masterBlindingKey,
    xpubs: {
      [NetworkName.Liquid]: getXpub(seed, NetworkName.Liquid),
      [NetworkName.Regtest]: getXpub(seed, NetworkName.Regtest),
      [NetworkName.Testnet]: getXpub(seed, NetworkName.Testnet),
    },
  }
}

export const deriveBlindingKeys = async (script: Buffer, wallet: Wallet): Promise<BlindingKeyPair> => {
  const { masterBlindingKey } = wallet
  if (!masterBlindingKey) throw new Error('Could not get masterBlindingKey')
  const blindingKeyNode = slip77.fromMasterBlindingKey(masterBlindingKey)
  if (!blindingKeyNode) throw new Error('No blinding key node, Account cannot derive blinding key')
  const { publicKey, privateKey } = blindingKeyNode.derive(script)
  if (!publicKey || !privateKey) throw new Error('Could not derive blinding keys')
  return { publicKey, privateKey }
}

export const getBalance = (wallet: Wallet): Satoshis => {
  const utxos = wallet.utxos[wallet.network]
  if (!utxos) return 0
  return utxos.reduce((prev, curr) => prev + curr.value, 0)
}

export const getUtxos = (wallet: Wallet): Utxo[] => {
  const utxos = wallet.utxos[wallet.network]
  return utxos ?? []
}
