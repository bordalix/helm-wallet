import ops from '@boltz/bitcoin-ops'
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371'
import { encodeCltv } from './SwapUtils'
import { createLeaf } from './TaprootUtils'

export const createRefundLeaf = (refundPublicKey: Buffer, timeoutBlockHeight: number) =>
  createLeaf([
    toXOnly(refundPublicKey),
    ops.OP_CHECKSIGVERIFY,
    encodeCltv(timeoutBlockHeight),
    ops.OP_CHECKLOCKTIMEVERIFY,
  ])
