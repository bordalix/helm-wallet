import { UtxoInfo, fetchTxHex } from './explorers'
import * as liquid from 'liquidjs-lib'
import zkpInit from '@vulpemventures/secp256k1-zkp'
import { Utxo } from './types'
import { Config } from '../providers/config'

let confidential: liquid.confidential.Confidential

export type BlindingKeyPair = {
  publicKey: Buffer
  privateKey: Buffer
}

export const unblindUtxo = async (utxo: UtxoInfo, blindingKeys: BlindingKeyPair, config: Config): Promise<Utxo> => {
  if (!confidential) confidential = new liquid.confidential.Confidential((await zkpInit()) as any)
  const { txid, vout } = utxo
  const txhex = await fetchTxHex(txid, config)
  const tx = liquid.Transaction.fromHex(txhex)
  return confidential.unblindOutputWithKey(tx.outs[vout], blindingKeys.privateKey)
}
