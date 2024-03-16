import { mnemonicToSeed } from 'bip39'
import BIP32Factory from 'bip32'
import { Mnemonic, Satoshis, XPubs } from './types'
import { NetworkName } from './network'
import { Config } from '../providers/config'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Wallet } from '../providers/wallet'
import * as liquid from 'liquidjs-lib'
import { SLIP77Factory } from 'slip77'
import { BlindingKeyPair } from './blinder'

const bip32 = BIP32Factory(ecc)
const slip77 = SLIP77Factory(ecc)

const derivationPath = {
  [NetworkName.Liquid]: "m/84'/1776'/0'",
  [NetworkName.Regtest]: "m/84'/1'/0'",
  [NetworkName.Testnet]: "m/84'/1'/0'",
}

export const gapLimits = [5, 20, 40, 80]

export const getMnemonicKeys = async ({ network }: Config, { mnemonic }: Wallet): Promise<ECPairInterface> => {
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterNode = bip32.fromSeed(seed)
  const key = masterNode.derivePath(derivationPath[network].replace('m/', ''))
  return ECPairFactory(ecc).fromPrivateKey(key.privateKey!)
}

export const generateRandomKeys = (config: Config): ECPairInterface => {
  const network = liquid.networks[config.network]
  return ECPairFactory(ecc).makeRandom({ network })
}

const getXpub = (seed: Buffer, network: NetworkName) => {
  return bip32.fromSeed(seed).derivePath(derivationPath[network]).neutered().toBase58()
}

export const getMasterKeys = async (mnemonic: Mnemonic): Promise<{ masterBlindingKey: string; xpubs: XPubs }> => {
  const slip77 = SLIP77Factory(ecc)
  const seed = await mnemonicToSeed(mnemonic)
  if (!seed) throw new Error('Could not get seed from mnemonic')
  const masterBlindingKey = slip77.fromSeed(seed).masterKey.toString('hex')
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

export const deriveBlindingKey = async (script: Buffer, wallet: Wallet): Promise<BlindingKeyPair> => {
  const { masterBlindingKey } = wallet
  if (!masterBlindingKey) throw new Error('Could not get masterBlindingKey')
  const blindingKeyNode = slip77.fromMasterBlindingKey(masterBlindingKey)
  if (!blindingKeyNode) throw new Error('No blinding key node, Account cannot derive blinding key')
  const { publicKey, privateKey } = blindingKeyNode.derive(script)
  if (!publicKey || !privateKey) throw new Error('Could not derive blinding keys')
  return { publicKey, privateKey }
}

export const balance = (wallet: Wallet): Satoshis => {
  if (!wallet.utxos) return 0
  return wallet.utxos.reduce((prev, curr) => prev + curr.value, 0)
}
