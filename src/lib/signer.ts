import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'
import { Pset, Signer, Transaction, script } from 'liquidjs-lib'
import { getCoinKeys } from './wallet'
import { Wallet } from '../providers/wallet'
import { Utxo } from './types'

let zkp: Secp256k1ZKP

export const signPset = async (pset: Pset, coins: Utxo[], wallet: Wallet) => {
  if (!zkp) zkp = await zkpInit()
  const signer = new Signer(pset)

  for (const [index] of signer.pset.inputs.entries()) {
    const keys = await getCoinKeys(coins[index], wallet)
    const sighash = Transaction.SIGHASH_ALL
    const signature = keys.sign(pset.getInputPreimage(index, sighash))
    signer.addSignature(
      index,
      {
        partialSig: {
          pubkey: coins[index].pubkey,
          signature: script.signature.encode(signature, sighash),
        },
      },
      Pset.ECDSASigValidator(zkp.ecc),
    )
  }

  return signer.pset
}
