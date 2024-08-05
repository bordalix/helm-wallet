import { ElectrumWS } from 'ws-electrumx-client'
import { address } from 'liquidjs-lib'
import { NetworkName } from './network'
import { MVUtxo } from './types'
import { ExplorerName, getWebSocketExplorerURL } from './explorers'
import { toScriptHash } from './address'

type ElectrumUnspent = {
  height: number
  tx_pos: number
  tx_hash: string
}

export type ElectrumTransaction = {
  height: number
  hex: string
  tx_hash: string
}

export type ElectrumHistory = {
  tx_hash: string
  height: number
}

export type ElectrumBlockHeader = {
  version: number
  previousBlockHash: string
  merkleRoot: string
  timestamp: number
  height: number
}

export type ChainSource = {
  explorer: ExplorerName
  network: NetworkName
  close(): Promise<void>
  fetchHistories(scripts: Buffer[]): Promise<ElectrumHistory[]>
  fetchBlockHeader(height: number): Promise<ElectrumBlockHeader>
  fetchChainTip(): Promise<number>
  fetchTransactions(txs: ElectrumHistory[]): Promise<ElectrumTransaction[]>
  fetchSingleTransaction(txid: string): Promise<string>
  isConnected(): boolean
  listUnspents(script: Buffer): Promise<ElectrumUnspent[]>
  listUtxos(script: Buffer): Promise<MVUtxo[]>
  waitForAddressReceivesTx(addr: string): Promise<string | null>
}

const GetTransactionMethod = 'blockchain.transaction.get'
const GetHistoryMethod = 'blockchain.scripthash.get_history'
const GetBlockHeaderMethod = 'blockchain.block.header'
const ListUnspentMethod = 'blockchain.scripthash.listunspent'
const SubscribeHeadersMethod = 'blockchain.headers.subscribe'
const SubscribeStatusMethod = 'blockchain.scripthash' // ElectrumWS add .subscribe to this

export class WsElectrumChainSource implements ChainSource {
  private ws: ElectrumWS

  constructor(public explorer: ExplorerName, public network: NetworkName, public tor = false) {
    const wsUrl = getWebSocketExplorerURL(explorer, network, tor)
    if (!wsUrl) throw new Error('Undefined ws url')
    this.ws = new ElectrumWS(wsUrl)
  }

  async fetchHistories(scripts: Buffer[]): Promise<ElectrumHistory[]> {
    const scriptsHashes = scripts.map((s) => toScriptHash(s))
    const responses = await this.ws.batchRequest<ElectrumHistory[][]>(
      ...scriptsHashes.map((s) => ({ method: GetHistoryMethod, params: [s] })),
    )
    const uniqueResponses: ElectrumHistory[] = []
    for (const a of responses) {
      for (const u of a) {
        const { height, tx_hash } = u
        if (!uniqueResponses.find((x) => x.tx_hash === tx_hash)) uniqueResponses.push({ tx_hash, height })
      }
    }
    return uniqueResponses
  }

  async fetchBlockHeader(height: number): Promise<ElectrumBlockHeader> {
    const hex = await this.ws.request<string>(GetBlockHeaderMethod, height)
    return deserializeBlockHeader(hex)
  }

  async fetchChainTip(): Promise<number> {
    const hex = await this.ws.request<{ height: number; hex: string }>(SubscribeHeadersMethod)
    return hex ? hex.height : 0
  }

  async fetchSingleTransaction(txid: string): Promise<string> {
    return await this.ws.request<string>(GetTransactionMethod, txid)
  }

  async fetchTransactions(txs: ElectrumHistory[]): Promise<ElectrumTransaction[]> {
    if (txs.length === 0) return []
    const responses = await this.ws.batchRequest<string[]>(
      ...txs.map(({ tx_hash }) => ({
        method: GetTransactionMethod,
        params: [tx_hash],
      })),
    )
    return responses.map((hex, i) => ({ height: txs[i].height, hex, tx_hash: txs[i].tx_hash }))
  }

  async listUtxos(script: Buffer): Promise<MVUtxo[]> {
    const scriptHash = toScriptHash(script)
    return (await this.ws.request<ElectrumUnspent[]>(ListUnspentMethod, scriptHash)).map(
      ({ height, tx_hash, tx_pos }) => ({
        height,
        txid: tx_hash,
        vout: tx_pos,
      }),
    )
  }

  async listUnspents(script: Buffer): Promise<ElectrumUnspent[]> {
    const scriptHash = toScriptHash(script)
    return await this.ws.request<ElectrumUnspent[]>(ListUnspentMethod, scriptHash)
  }

  waitForAddressReceivesTx(addr: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.subscribeScriptStatus(address.toOutputScript(addr), (_, status) => {
        if (status !== null) {
          // this.unsubscribeScriptStatus(address.toOutputScript(addr)) // TODO
          resolve(status)
        }
      }).catch(reject)
    })
  }

  async close() {
    if (this.ws.isConnected()) this.ws.close('close').catch((e) => console.log('error closing ws:', e))
  }

  isConnected() {
    return this.ws.isConnected()
  }

  private async unsubscribeScriptStatus(script: Buffer): Promise<void> {
    try {
      await this.ws.unsubscribe(SubscribeStatusMethod, toScriptHash(script))
    } catch (e) {
      console.log('error unsubscribing:', e)
    }
  }

  private async subscribeScriptStatus(script: Buffer, callback: (scripthash: string, status: string | null) => void) {
    const scriptHash = toScriptHash(script)
    await this.ws.subscribe(
      SubscribeStatusMethod,
      (scripthash: unknown, status: unknown) => {
        if (scripthash === scriptHash) {
          callback(scripthash, status as string | null)
        }
      },
      scriptHash,
    )
  }
}

const DYNAFED_HF_MASK = 2147483648

function deserializeBlockHeader(hex: string): ElectrumBlockHeader {
  const buffer = Buffer.from(hex, 'hex')
  let offset = 0

  let version = buffer.readUInt32LE(offset)
  offset += 4

  const isDyna = (version & DYNAFED_HF_MASK) !== 0
  if (isDyna) {
    version = version & ~DYNAFED_HF_MASK
  }

  const previousBlockHash = buffer
    .subarray(offset, offset + 32)
    .reverse()
    .toString('hex')
  offset += 32

  const merkleRoot = buffer.subarray(offset, offset + 32).toString('hex')
  offset += 32

  const timestamp = buffer.readUInt32LE(offset)
  offset += 4

  const height = buffer.readUInt32LE(offset)
  offset += 4

  return {
    version,
    previousBlockHash,
    merkleRoot,
    timestamp,
    height,
  }
}
