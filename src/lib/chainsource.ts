import { ElectrumWS } from 'ws-electrumx-client'
import { address, crypto } from 'liquidjs-lib'
import { NetworkName } from './network'

type UnspentElectrum = {
  height: number
  tx_pos: number
  tx_hash: string
}

type Unspent = {
  txid: string
  vout: number
  witnessUtxo: string
}

export type TransactionHistory = {
  tx_hash: string
  height: number
}[]

export type BlockHeader = {
  version: number
  previousBlockHash: string
  merkleRoot: string
  timestamp: number
  height: number
}

export type ChainSource = {
  network: NetworkName
  waitForAddressReceivesTx(addr: string): Promise<void>
  fetchHistories(scripts: Buffer[]): Promise<TransactionHistory[]>
  fetchBlockHeader(height: number): Promise<BlockHeader>
  fetchTransactions(txids: string[]): Promise<{ txID: string; hex: string }[]>
  listUnspents(address: string): Promise<Unspent[]>
  close(): Promise<void>
}

// returns electrum url based on network
const electrumURL = (network: NetworkName): string => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001' // TODO
    case 'testnet':
      return 'wss://blockstream.info/liquidtestnet/electrum-websocket/api'
    default:
      return 'wss://blockstream.info/liquid/electrum-websocket/api'
  }
}

const GetTransactionMethod = 'blockchain.transaction.get'
const GetHistoryMethod = 'blockchain.scripthash.get_history'
const GetBlockHeaderMethod = 'blockchain.block.header'
const ListUnspentMethod = 'blockchain.scripthash.listunspent'
const SubscribeStatusMethod = 'blockchain.scripthash' // ElectrumWS add .subscribe to this

export class WsElectrumChainSource implements ChainSource {
  private ws: ElectrumWS

  constructor(public network: NetworkName) {
    this.ws = new ElectrumWS(electrumURL(network))
  }

  async fetchHistories(scripts: Buffer[]): Promise<TransactionHistory[]> {
    const scriptsHashes = scripts.map((s) => toScriptHash(s))
    const responses = await this.ws.batchRequest<TransactionHistory[]>(
      ...scriptsHashes.map((s) => ({ method: GetHistoryMethod, params: [s] })),
    )
    return responses
  }

  async fetchBlockHeader(height: number): Promise<BlockHeader> {
    const hex = await this.ws.request<string>(GetBlockHeaderMethod, height)
    return deserializeBlockHeader(hex)
  }

  async fetchTransactions(txids: string[]): Promise<{ txID: string; hex: string }[]> {
    const responses = await this.ws.batchRequest<string[]>(
      ...txids.map((txid) => ({
        method: GetTransactionMethod,
        params: [txid],
      })),
    )
    return responses.map((hex, i) => ({ txID: txids[i], hex }))
  }

  async listUnspents(addr: string): Promise<Unspent[]> {
    const scriptHash = toScriptHash(address.toOutputScript(addr))
    const unspentsFromElectrum = await this.ws.request<UnspentElectrum[]>(ListUnspentMethod, scriptHash)
    const txs = await this.fetchTransactions(unspentsFromElectrum.map((u) => u.tx_hash))

    return unspentsFromElectrum.map((u, index) => {
      return {
        txid: u.tx_hash,
        vout: u.tx_pos,
        // witnessUtxo: Transaction.fromHex(txs[index].hex).outs[u.tx_pos],
        witnessUtxo: txs[index].hex,
      }
    })
  }

  waitForAddressReceivesTx(addr: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.subscribeScriptStatus(address.toOutputScript(addr), (_, status) => {
        if (status !== null) {
          resolve()
          // this.unsubscribeScriptStatus(address.toOutputScript(addr)).finally(
          //   () => resolve(),
          // )
        }
      }).catch(reject)
    })
  }

  async close() {
    try {
      await this.ws.close('close')
    } catch (e) {
      console.log('error closing ws:', e)
    }
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

function toScriptHash(script: Buffer): string {
  return crypto.sha256(script).reverse().toString('hex')
}

const DYNAFED_HF_MASK = 2147483648

function deserializeBlockHeader(hex: string): BlockHeader {
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
