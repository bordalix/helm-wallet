import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'
import { UnblindedOutput, Utxo } from './types'
import { Blinder, confidential, Pset, Transaction, ZKPGenerator, ZKPValidator } from 'liquidjs-lib'

let zkp: Secp256k1ZKP

export type BlindingKeyPair = {
  publicKey: Buffer
  privateKey: Buffer
}

/**
 * unblind output with blinding private key
 *
 * output is found via parmas txHex and vout
 */
export const unblindOutput = async (
  vout: number,
  txHex: string,
  blindingKeys: BlindingKeyPair,
): Promise<UnblindedOutput> => {
  if (!zkp) zkp = await zkpInit()
  const confi = new confidential.Confidential(zkp as any)
  const tx = Transaction.fromHex(txHex)
  const unblinded = confi.unblindOutputWithKey(tx.outs[vout], blindingKeys.privateKey)
  return { ...unblinded, prevout: tx.outs[vout] }
}

/** blind Pset */
export const blindPset = async (pset: Pset, utxos: Utxo[]) => {
  if (!zkp) zkp = await zkpInit()
  const zkpValidator = new ZKPValidator(zkp as any)
  const zkpGenerator = new ZKPGenerator(
    zkp as any,
    ZKPGenerator.WithBlindingKeysOfInputs(utxos.map((utxo) => utxo.blindingPrivateKey!)),
  )
  const outputBlindingArgs = zkpGenerator.blindOutputs(pset, Pset.ECCKeysGenerator(zkp.ecc))
  const blinder = new Blinder(pset, zkpGenerator.unblindInputs(pset), zkpValidator, zkpGenerator)
  blinder.blindLast({ outputBlindingArgs })
  return blinder.pset
}
