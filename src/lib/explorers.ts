import { Config } from '../providers/config'
import { NetworkName } from './network'

export enum ExplorerName {
  Blockstream = 'Blockstream',
  Mempool = 'Mempool',
  Nigiri = 'Nigiri',
}

export interface ExplorerURLs {
  webExplorerURL: string
  websocketExplorerURL: string // ws:// or wss:// endpoint
}

export interface Explorer {
  name: ExplorerName
  [NetworkName.Liquid]?: ExplorerURLs
  [NetworkName.Testnet]?: ExplorerURLs
  [NetworkName.Regtest]?: ExplorerURLs
}

const explorers: Explorer[] = [
  {
    name: ExplorerName.Blockstream,
    [NetworkName.Liquid]: {
      webExplorerURL: 'https://blockstream.info/liquid',
      websocketExplorerURL: 'wss://blockstream.info/liquid/electrum-websocket/api',
    },
    [NetworkName.Testnet]: {
      webExplorerURL: 'https://blockstream.info/liquidtestnet',
      websocketExplorerURL: 'wss://blockstream.info/liquidtestnet/electrum-websocket/api',
    },
  },
  {
    name: ExplorerName.Mempool,
    [NetworkName.Liquid]: {
      webExplorerURL: 'https://liquid.network',
      websocketExplorerURL: 'wss://esplora.blockstream.com/liquid/electrum-websocket/api',
    },
    [NetworkName.Testnet]: {
      webExplorerURL: 'https://liquid.network/liquidtestnet',
      websocketExplorerURL: 'wss://esplora.blockstream.com/liquidtestnet/electrum-websocket/api',
    },
  },
  {
    name: ExplorerName.Nigiri,
    [NetworkName.Regtest]: {
      webExplorerURL: 'http://localhost:5001',
      websocketExplorerURL: 'ws://127.0.0.1:1234',
    },
  },
]

export const getExplorerNames = ({ network }: Config) => explorers.filter((e: any) => e[network]).map((e) => e.name)

export const getExplorerURL = ({ network, explorer }: Config) => {
  const exp = explorers.find((e) => e.name === explorer)
  if (exp && exp[network]) return exp[network]?.webExplorerURL
}

export const getTxIdURL = (txid: string, config: Config) => {
  return `${getExplorerURL(config)}/tx/${txid}`
}

export interface AddressInfo {
  address: string
  chain_stats: {
    funded_txo_count: number
    spent_txo_count: number
    tx_count: number
  }
  mempool_stats: {
    funded_txo_count: number
    spent_txo_count: number
    tx_count: number
  }
}

export const fetchAddress = async (address: string, config: Config): Promise<AddressInfo> => {
  const explorerURL = getExplorerURL(config)
  const url = `${explorerURL}/api/address/${address}`
  const response = await fetch(url)
  return await response.json()
}

export interface AddressTxInfo {
  txid: string
  version: number
  locktime: number
  vin: [any]
  vout: [any]
  size: number
  weight: number
  fee: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
}

export const fetchAddressTxs = async (address: string, config: Config): Promise<AddressTxInfo[]> => {
  const explorerURL = getExplorerURL(config)
  const url = `${explorerURL}/api/address/${address}/txs`
  const response = await fetch(url)
  return await response.json()
}

export interface UtxoInfo {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  asset: string
  value: number
  valuecommitment: string
  assetcommitment: string
  noncecommitment: string
}

export const fetchUtxos = async (address: string, config: Config): Promise<UtxoInfo[]> => {
  const url = `${getExplorerURL(config)}/api/address/${address}/utxo`
  const response = await fetch(url)
  return await response.json()
}

export const fetchTxHex = async (txid: string, config: Config): Promise<string> => {
  const url = `${getExplorerURL(config)}/api/tx/${txid}/hex`
  const response = await fetch(url)
  return await response.text()
}
