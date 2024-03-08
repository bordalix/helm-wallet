import { mnemonicToSeed } from 'bip39'
import BIP32Factory from 'bip32'
import { BlindingKeyPair, Mnemonic, Satoshis, Utxo, XPubs } from './types'
import { NetworkName, getNetwork } from './network'
import { Config } from '../providers/config'
import { ECPairFactory, ECPairInterface } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { Wallet } from '../providers/wallet'
import * as liquid from 'liquidjs-lib'
import { UtxoInfo, fetchAddress, fetchTxHex, fetchUtxos } from './explorers'
import { SLIP77Factory } from 'slip77'
import zkpInit from '@vulpemventures/secp256k1-zkp'

const bip32 = BIP32Factory(ecc)
const slip77 = SLIP77Factory(ecc)

let confidential: liquid.confidential.Confidential

const derivationPath = {
  [NetworkName.Liquid]: "m/84'/1776'/0'",
  [NetworkName.Regtest]: "m/84'/1'/0'",
  [NetworkName.Testnet]: "m/84'/1'/0'",
}

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

const getXpub = (seed: Buffer, network: NetworkName) =>
  bip32.fromSeed(seed).derivePath(derivationPath[network]).neutered().toBase58()

export const getXPubs = async (mnemonic: Mnemonic): Promise<{ masterBlindingKey: string; xpubs: XPubs }> => {
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

const deriveBlindingKey = async (script: Buffer, wallet: Wallet): Promise<BlindingKeyPair> => {
  const { masterBlindingKey } = wallet
  if (!masterBlindingKey) throw new Error('Could not get masterBlindingKey')
  const blindingKeyNode = slip77.fromMasterBlindingKey(masterBlindingKey)
  if (!blindingKeyNode) throw new Error('No blinding key node, Account cannot derive blinding key')
  const { publicKey, privateKey } = blindingKeyNode.derive(script)
  if (!publicKey || !privateKey) throw new Error('Could not derive blinding keys')
  return { publicKey, privateKey }
}

export const generateAddress = async (
  wallet: Wallet,
  index?: number,
  chain = 1,
): Promise<{
  address: string
  blindingKeys: BlindingKeyPair
  confidentialAddress: string
  pubkey: Buffer
  script: Buffer
}> => {
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

const unblindUtxo = async (utxo: UtxoInfo, blindingKeys: BlindingKeyPair, config: Config): Promise<Utxo> => {
  if (!confidential) confidential = new liquid.confidential.Confidential((await zkpInit()) as any)
  const { txid, vout } = utxo
  const txhex = await fetchTxHex(config, txid)
  const tx = liquid.Transaction.fromHex(txhex)
  return confidential.unblindOutputWithKey(tx.outs[vout], blindingKeys.privateKey)
}

export const getUtxos = async (config: Config, wallet: Wallet, defaultGap = 5): Promise<Utxo[]> => {
  const utxos: Utxo[] = []
  for (let chain = 1; chain < 2; chain++) {
    // TODO: cycle makes sense?
    let index = 0
    let gap = defaultGap
    while (gap > 0) {
      const { address, blindingKeys } = await generateAddress(wallet, index, chain)
      if (!address) throw new Error('Could not generate new address')
      const data = await fetchAddress(config, address)
      if (data?.chain_stats?.tx_count > 0) {
        gap = defaultGap // resets gap
        for (const utxo of await fetchUtxos(config, address)) {
          const unblinded = await unblindUtxo(utxo, blindingKeys, config)
          utxos.push({ ...utxo, ...unblinded })
        }
      }
      index += 1
      gap -= 1
    }
  }
  const lbtc = liquid.networks[config.network].assetHash
  return utxos.filter((utxo) => utxo.asset.reverse().toString('hex') === lbtc)
}

export const balance = (wallet: Wallet): Satoshis => {
  if (!wallet.utxos) return 0
  return wallet.utxos.reduce((prev, curr) => prev + curr.value, 0)
}

export const selectUtxos = (mnemonic: Mnemonic, amount: Satoshis) => {
  console.log(mnemonic, amount) // TODO
}
