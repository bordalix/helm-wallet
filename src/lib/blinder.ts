import * as ecc from '@bitcoinerlab/secp256k1'
import { Secp256k1Interface, TxOutput } from 'liquidjs-lib'
import { Confidential } from 'liquidjs-lib/src/confidential'
import { SLIP77Factory } from 'slip77'
import secp256k1 from '@vulpemventures/secp256k1-zkp'
import { Unspent, Utxo } from './types'

const slip77 = SLIP77Factory(ecc)

export const getMasterBlindingKey = (seed: Buffer) => slip77.fromSeed(seed).masterKey.toString('hex')

export const unblindUnspents = async (unspents: Unspent[]): Promise<Unspent[]> => {
  const zkpLib = (await secp256k1()) as Secp256k1Interface
  const confidential = new Confidential(zkpLib)
  for (const unspent of unspents) {
    const { blindingPrivkey, output, utxos } = unspent
    for (let utxo of utxos) {
      console.log('utxo', utxo)
      if (utxo.asset && utxo.value) continue
      const out: TxOutput = {
        asset: Buffer.from(utxo.assetcommitment, 'hex'),
        nonce: Buffer.from(utxo.noncecommitment, 'hex'),
        value: Buffer.from(utxo.valuecommitment, 'hex'),
        script: output,
      }
      console.log(out, blindingPrivkey)
      const unblindedUtxo = confidential.unblindOutputWithKey(out, blindingPrivkey)
      utxo = unblindedUtxo
    }
  }
  return unspents
}

export const deriveBlindingKey = (
  masterBlindingKey: string,
  script: Buffer,
): { publicKey: Buffer; privateKey: Buffer } => {
  const blindingKeyNode = slip77.fromMasterBlindingKey(masterBlindingKey)
  if (!blindingKeyNode) throw new Error('No blinding key node, cannot derive blinding key')
  const { publicKey, privateKey } = blindingKeyNode.derive(script)
  if (!publicKey || !privateKey) throw new Error('Could not derive blinding key')
  return { publicKey, privateKey }
}
