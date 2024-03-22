import { Extractor, Finalizer } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { Config } from '../providers/config'
import { broadcastTxHex } from './explorers'

export const finalizeAndBroadcast = async (pset: any, config: Config, wallet: Wallet) => {
  const finalizer = new Finalizer(pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()
  console.log('txHex', txHex)
  const txid = await broadcastTxHex(txHex, config, wallet)
  console.log('txid', txid)
  return txid
}
