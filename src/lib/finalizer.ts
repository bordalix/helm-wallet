import { Extractor, Finalizer, Pset } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { broadcastTxHex } from './explorers'

export const finalizeAndBroadcast = async (pset: Pset, wallet: Wallet) => {
  const finalizer = new Finalizer(pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()
  console.log('txHex', txHex)
  const txid = await broadcastTxHex(txHex, wallet)
  console.log('txid', txid)
  return txid
}
