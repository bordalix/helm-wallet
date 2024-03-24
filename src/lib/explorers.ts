import { Wallet } from '../providers/wallet'
import { NetworkName } from './network'
import { BlindedUtxo } from './types'

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

export const getExplorerNames = (network: NetworkName) =>
  explorers.filter((e: Explorer) => e[network]).map((e) => e.name)

const getExplorerURL = ({ explorer, network }: Wallet) => {
  const exp = explorers.find((e) => e.name === explorer)
  if (exp?.[network]) return exp[network]?.webExplorerURL
}

export const getTxIdURL = (txid: string, wallet: Wallet) => {
  // stupid bug from mempool
  const url = getExplorerURL(wallet)?.replace('https://liquid.network/liquidtestnet', 'https://liquid.network/testnet')
  return `${url}/tx/${txid}`
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

export const fetchAddress = async (address: string, wallet: Wallet): Promise<AddressInfo> => {
  const url = `${getExplorerURL(wallet)}/api/address/${address}`
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

export const fetchAddressTxs = async (address: string, wallet: Wallet): Promise<AddressTxInfo[]> => {
  const explorerURL = getExplorerURL(wallet)
  const url = `${explorerURL}/api/address/${address}/txs`
  const response = await fetch(url)
  return await response.json()
}

export const fetchUtxos = async (address: string, wallet: Wallet): Promise<BlindedUtxo[]> => {
  const url = `${getExplorerURL(wallet)}/api/address/${address}/utxo`
  const response = await fetch(url)
  return await response.json()
}

export const fetchTxHex = async (txid: string, wallet: Wallet): Promise<string> => {
  const url = `${getExplorerURL(wallet)}/api/tx/${txid}/hex`
  const response = await fetch(url)
  return await response.text()
}

export const broadcastTxHex = async (txHex: string, wallet: Wallet): Promise<{ id: string }> => {
  const t = wallet.network === NetworkName.Testnet ? 'testnet.' : ''
  const url = `https://api.${t}boltz.exchange/v2/chain/L-BTC/transaction`
  const response = await fetch(url, {
    body: JSON.stringify({ hex: txHex }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  return await response.json()
}
