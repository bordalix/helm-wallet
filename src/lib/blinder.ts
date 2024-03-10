import { fetchTxHex } from './explorers'
import * as liquid from 'liquidjs-lib'
import zkpInit from '@vulpemventures/secp256k1-zkp'
import { UnblindedOutput } from './types'
import { Config } from '../providers/config'

let confidential: liquid.confidential.Confidential

export type BlindingKeyPair = {
  publicKey: Buffer
  privateKey: Buffer
}

export const unblindOutput = async (
  txid: string,
  vout: number,
  blindingKeys: BlindingKeyPair,
  config: Config,
): Promise<UnblindedOutput> => {
  if (!confidential) confidential = new liquid.confidential.Confidential((await zkpInit()) as any)
  const txhex = await fetchTxHex(txid, config)
  const tx = liquid.Transaction.fromHex(txhex)
  const unblinded = confidential.unblindOutputWithKey(tx.outs[vout], blindingKeys.privateKey)
  return { ...unblinded, value: Number(unblinded.value) }
}
