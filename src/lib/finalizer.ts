import { Extractor, Finalizer, Pset } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { broadcastTxHex } from './explorers'
import { Config } from '../providers/config'

export const finalizeAndBroadcast = async (pset: Pset, wallet: Wallet, config: Config) => {
  const finalizer = new Finalizer(pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()
  console.log('txHex', txHex)
  const { id } = await broadcastTxHex(txHex, wallet, config)
  console.log('txid', id)
  return id
}
