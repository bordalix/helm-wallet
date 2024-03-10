import { NetworkName } from './network'

export type Mnemonic = string
export type Password = string
export type Satoshis = number

export type Transaction = {
  amount: number
  date: number
  txid: string
}

export type UnblindedOutput = any

export type Utxo = any

export type XPub = string
export type XPubs = Record<NetworkName, XPub>
