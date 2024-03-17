import { TxOutput } from 'liquidjs-lib'
import { NetworkName } from './network'

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
  date: number
  txid: string
}
export type Transactions = Record<NetworkName, Transaction[]>

export type UnblindedOutput = any

export type Utxo = any
export type Utxos = Record<NetworkName, Utxo[]>

export type XPub = string
export type XPubs = Record<NetworkName, XPub>
