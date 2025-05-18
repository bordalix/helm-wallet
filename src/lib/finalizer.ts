import { Extractor, Finalizer, Pset } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { broadcastTxHex } from './explorers'
import { Config } from '../providers/config'
import { consoleLog } from './logs'

export const finalizeAndBroadcast = async (pset: Pset, wallet: Wallet, config: Config) => {
  const finalizer = new Finalizer(pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()
  const { id } = await broadcastTxHex(txHex, wallet, config)
  consoleLog('Transaction broadcasted', { id, txHex })
  return id
}
