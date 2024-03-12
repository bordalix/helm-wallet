import { Transaction } from 'bitcoinjs-lib'
import { Musig } from 'boltz-core'
import { Buffer } from 'buffer'
import { Transaction as LiquidTransaction } from 'liquidjs-lib'
import { getExplorerURL } from './explorers'
import { Config } from '../providers/config'

type ReverseMinerFees = {
  lockup: number
  claim: number
}

type LegacyMinerFees = {
  normal: number
  reverse: ReverseMinerFees
}

type PairLimits = {
  minimal: number
  maximal: number
}

type PairType = {
  hash: string
  rate: number
}

export type PairLegacy = PairType & {
  limits: PairLimits & {
    maximalZeroConf: {
      baseAsset: number
      quoteAsset: number
    }
  }
  fees: {
    percentage: number
    percentageSwapIn: number
    minerFees: {
      baseAsset: LegacyMinerFees
      quoteAsset: LegacyMinerFees
    }
  }
}

export type SubmarinePairTypeTaproot = PairType & {
  limits: PairLimits & {
    maximalZeroConf: number
  }
  fees: {
    percentage: number
    minerFees: number
  }
}

export type ReversePairTypeTaproot = PairType & {
  limits: PairLimits
  fees: {
    percentage: number
    minerFees: ReverseMinerFees
  }
}

type SubmarinePairsTaproot = Record<string, Record<string, SubmarinePairTypeTaproot>>

type ReversePairsTaproot = Record<string, Record<string, ReversePairTypeTaproot>>

export type Pairs = {
  submarine: SubmarinePairsTaproot
  reverse: ReversePairsTaproot
}

export type PartialSignature = {
  pubNonce: Buffer
  signature: Buffer
}

export type TransactionInterface = Transaction | LiquidTransaction

export const fetcher = async <T = any>(url: string, config: Config, params: any | undefined = null): Promise<T> => {
  let opts = {}
  if (params) {
    opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  }
  const apiUrl = getExplorerURL(config) + url
  const response = await fetch(apiUrl, opts)
  if (!response.ok) {
    return Promise.reject(response)
  }
  return response.json()
}

export const getPairs = async (config: Config): Promise<Pairs> => {
  const [submarine, reverse] = await Promise.all([
    fetcher<SubmarinePairsTaproot>('/v2/swap/submarine', config),
    fetcher<ReversePairsTaproot>('/v2/swap/reverse', config),
  ])

  return {
    reverse,
    submarine,
  }
}

export const getPartialRefundSignature = async (
  config: Config,
  id: string,
  pubNonce: Buffer,
  transaction: TransactionInterface,
  index: number,
): Promise<PartialSignature> => {
  const res = await fetcher(`/v2/swap/submarine/${id}/refund`, config, {
    index,
    pubNonce: pubNonce.toString('hex'),
    transaction: transaction.toHex(),
  })
  return {
    pubNonce: Musig.parsePubNonce(res.pubNonce),
    signature: Buffer.from(res.partialSignature, 'hex'),
  }
}

export const getPartialReverseClaimSignature = async (
  config: Config,
  id: string,
  preimage: Buffer,
  pubNonce: Buffer,
  transaction: TransactionInterface,
  index: number,
): Promise<PartialSignature> => {
  const res = await fetcher(`/v2/swap/reverse/${id}/claim`, config, {
    index,
    preimage: preimage.toString('hex'),
    pubNonce: pubNonce.toString('hex'),
    transaction: transaction.toHex(),
  })
  return {
    pubNonce: Musig.parsePubNonce(res.pubNonce),
    signature: Buffer.from(res.partialSignature, 'hex'),
  }
}

export const getSubmarineClaimDetails = async (config: Config, id: string) => {
  const res = await fetcher(`/v2/swap/submarine/${id}/claim`, config)
  return {
    pubNonce: Musig.parsePubNonce(res.pubNonce),
    preimage: Buffer.from(res.preimage, 'hex'),
    transactionHash: Buffer.from(res.transactionHash, 'hex'),
  }
}

export const postSubmarineClaimDetails = (
  config: Config,
  id: string,
  pubNonce: Buffer | Uint8Array,
  partialSignature: Buffer | Uint8Array,
) =>
  fetcher(`/v2/swap/submarine/${id}/claim`, config, {
    pubNonce: Buffer.from(pubNonce).toString('hex'),
    partialSignature: Buffer.from(partialSignature).toString('hex'),
  })

export const getSubmarineEipSignature = (config: Config, id: string) =>
  fetcher<{ signature: string }>(`/v2/swap/submarine/${id}/refund`, config)

export const getFeeEstimations = (config: Config) => fetcher<Record<string, number>>('/v2/chain/fees', config)

export const broadcastTransaction = (config: Config, txHex: string) =>
  fetcher<{ id: string }>(`/v2/chain/L-BTC/transaction`, config, {
    hex: txHex,
  })

export const getSubmarineTransaction = (config: Config, id: string) =>
  fetcher<{
    id: string
    hex: string
    timeoutBlockHeight: number
    timeoutEta?: number
  }>(`/v2/swap/submarine/${id}/transaction`, config)

export const getReverseTransaction = (config: Config, id: string) =>
  fetcher<{
    id: string
    hex: string
    timeoutBlockHeight: number
  }>(`/v2/swap/reverse/${id}/transaction`, config)

export const getSwapStatus = (config: Config, id: string) =>
  fetcher<{
    status: string
    failureReason?: string
    zeroConfRejected?: boolean
    transaction?: {
      id: string
      hex: string
    }
  }>(`/v2/swap/${id}`, config)
