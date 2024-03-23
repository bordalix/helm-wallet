import { TxOutput, confidential } from 'liquidjs-lib'
import { NetworkName } from './network'
import { Output } from 'liquidjs-lib/src/transaction'

export type Mnemonic = string
export type Password = string
export type Satoshis = number

export type DecodedAddress = { script: Buffer; blindingKey?: Buffer }

export type LiquidTransactionOutputWithKey = TxOutput & {
  blindingPrivateKey?: Buffer
}

export type NextIndex = number
export type NextIndexes = Record<NetworkName, NextIndex>

export type Transaction = {
  amount: number
  date: string
  txid: string
  unixdate: number
}
export type Transactions = Record<NetworkName, Transaction[]>

export type UnblindedOutput = confidential.UnblindOutputResult & { prevout: Output }

export type BlindedUtxo = {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  valuecommitment: string
  assetcommitment: string
  noncecommitment: string
}

export type Utxo = BlindedUtxo & {
  value: number
  asset: string
  address: string
  blindingPublicKey: Buffer
  blindingPrivateKey: Buffer
  nextIndex: number
  pubkey: Buffer
  script: Buffer
  valueBlindingFactor?: Buffer
  assetBlindingFactor?: Buffer
  prevout?: {
    asset: Buffer
    value: Buffer
    nonce: Buffer
    script: Buffer
    rangeProof?: Buffer
    surjectionProof?: Buffer
  }
}

export type Utxos = Record<NetworkName, Utxo[]>

export type XPub = string
export type XPubs = Record<NetworkName, XPub>
