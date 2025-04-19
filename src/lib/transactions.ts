import { getBalance } from './wallet'
import { Wallet } from '../providers/wallet'
import { selectCoins } from './coinSelection'
import { blindPset } from './blinder'
import { buildPset } from './pset'
import { signPset } from './signer'
import { finalizeAndBroadcast } from './finalizer'
import { feeForCoins } from './fees'
import * as liquid from 'liquidjs-lib'
import { ChainSource } from './chainsource'
import { NewAddress } from './address'
import { getOutputValue } from './output'
import { Config } from '../providers/config'
import { getCachedTransaction } from './cache'
import { hex } from '@scure/base'

export const sendSats = async (
  sats: number,
  destinationAddress: string,
  wallet: Wallet,
  config: Config,
): Promise<string> => {
  // check if enough balance
  const utxos = wallet.utxos[wallet.network]
  const balance = getBalance(wallet)
  if (!balance || balance - sats - feeForCoins(utxos.length) < 0) return ''

  // select coins, build pset, blind it, sign it and broadcast it
  const coinSelection = selectCoins(sats, utxos)
  const pset = await buildPset(coinSelection, destinationAddress, wallet)
  const blindedPset = await blindPset(pset, coinSelection.coins)
  const signedPset = await signPset(blindedPset, coinSelection.coins, wallet)
  const txid = await finalizeAndBroadcast(signedPset, wallet, config)

  return txid
}

export const getTransactionAmount = async (address: NewAddress, txHex: string, chainSource: ChainSource) => {
  let amount = 0
  const tx = liquid.Transaction.fromHex(txHex)
  for (const vin of tx.ins) {
    const witnessPubkey = vin.witness[1] ? hex.encode(vin.witness[1]) : undefined
    if (witnessPubkey === hex.encode(address.pubkey)) {
      const hexTx = await getCachedTransaction(hex.encode(Uint8Array.from(vin.hash).reverse()), chainSource)
      const value = await getOutputValue(vin.index, hexTx, address.blindingKeys)
      amount -= Number(value)
    }
  }
  for (const [idx, vout] of tx.outs.entries()) {
    if (hex.encode(vout.script) === hex.encode(address.script)) {
      const value = await getOutputValue(idx, txHex, address.blindingKeys)
      amount += Number(value)
    }
  }
  return amount
}
