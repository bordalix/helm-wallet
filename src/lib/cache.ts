import { ChainSource, ElectrumBlockHeader, ElectrumHistory, ElectrumTransaction } from './chainsource'
import { readCacheFromStorage, saveCacheToStorage } from './storage'

export interface CacheInfo {
  blockHeaders: ElectrumBlockHeader[]
  electrumTxs: ElectrumTransaction[]
  txHexas: any[]
}

export const defaultCache: CacheInfo = {
  blockHeaders: [],
  electrumTxs: [],
  txHexas: [],
}

export const getCache = (): CacheInfo => {
  const cache = readCacheFromStorage() ?? defaultCache
  for (const key of Object.keys(defaultCache)) {
    if (!cache[key as keyof CacheInfo]) cache[key as keyof CacheInfo] = []
  }
  return cache
}

export const updateCache = (cache: CacheInfo) => {
  const onlyConfirmedTxs = cache.electrumTxs.filter((tx) => tx.height > 2)
  return saveCacheToStorage({ ...cache, electrumTxs: onlyConfirmedTxs })
}

export const cleanCache = () => saveCacheToStorage(defaultCache)

export const getCachedBlockHeader = async (height: number, chainSource: ChainSource) => {
  const cache = getCache()
  const inCache = cache.blockHeaders.find((bh) => bh.height === height)
  if (inCache) return inCache
  const bh = await chainSource.fetchBlockHeader(height)
  cache.blockHeaders.push(bh)
  updateCache(cache)
  return bh
}

export const getCachedElectrumTransactions = async (history: ElectrumHistory[], chainSource: ChainSource) => {
  const cache = getCache()
  const toFetch = history.filter((h) => !cache.electrumTxs.find((t) => t.tx_hash === h.tx_hash))
  if (toFetch) {
    for (const tx of await chainSource.fetchTransactions(toFetch)) {
      if (!cache.electrumTxs.find((t) => t.tx_hash === tx.tx_hash)) cache.electrumTxs.push(tx)
    }
  }
  updateCache(cache)
  return history.map((h): ElectrumTransaction => cache.electrumTxs.find((t) => t.tx_hash === h.tx_hash)!)
}

export const getCachedTransaction = async (txid: string, chainSource: ChainSource): Promise<string> => {
  const cache = getCache()
  const inCache = cache.txHexas.find((tx) => tx.txid === txid)
  if (inCache) return inCache.hex
  const hex = await chainSource.fetchSingleTransaction(txid)
  cache.txHexas.push({ txid, hex })
  updateCache(cache)
  return hex
}
