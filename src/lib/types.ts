import { NetworkName } from './network'

export type Mnemonic = string
export type Password = string
export type Satoshis = number

export type Utxo = any

export type Unspent = {
  address: string
  blindingPrivkey: Buffer
  chain: number
  index: number
  output: Buffer
  utxos: Utxo[]
}

export type BlindingKeyPair = {
  publicKey: Buffer
  privateKey: Buffer
}

export type XPub = string
export type XPubs = Record<NetworkName, XPub>
