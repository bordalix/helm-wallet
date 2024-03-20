import { fetchTxHex } from './explorers'
import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'
import { UnblindedOutput } from './types'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { Blinder, confidential, OwnedInput, Pset, Transaction, ZKPGenerator, ZKPValidator } from 'liquidjs-lib'

let zkp: Secp256k1ZKP

export type BlindingKeyPair = {
  publicKey: Buffer
  privateKey: Buffer
}

export const unblindOutput = async (
  txid: string,
  vout: number,
  blindingKeys: BlindingKeyPair,
  config: Config,
  wallet: Wallet,
): Promise<UnblindedOutput> => {
  if (!zkp) zkp = await zkpInit()
  const confi = new confidential.Confidential(zkp as any)
  const txhex = await fetchTxHex(txid, config, wallet)
  const tx = Transaction.fromHex(txhex)
  const unblinded = confi.unblindOutputWithKey(tx.outs[vout], blindingKeys.privateKey)
  return { ...unblinded, value: Number(unblinded.value) }
}

export const blindPset = async (pset: Pset, ownedInput: OwnedInput): Promise<Pset> => {
  if (!zkp) zkp = await zkpInit()
  const { ecc } = zkp
  const zkpValidator = new ZKPValidator(zkp as any)
  const zkpGenerator = new ZKPGenerator(zkp as any, ZKPGenerator.WithOwnedInputs([ownedInput]))
  const outputBlindingArgs = zkpGenerator.blindOutputs(pset, Pset.ECCKeysGenerator(ecc))
  const blinder = new Blinder(pset, [ownedInput], zkpValidator, zkpGenerator)
  blinder.blindLast({ outputBlindingArgs })
  return blinder.pset
}
