import { getBalance } from './wallet'
import { Wallet } from '../providers/wallet'
import { selectCoins } from './coinSelection'
import { blindPset } from './blinder'
import { buildPset } from './pset'
import { signPset } from './signer'
import { finalizeAndBroadcast } from './finalizer'
import { feeForCoins } from './fees'
import * as liquid from 'liquidjs-lib'
import { ChainSource, ElectrumBlockHeader, ElectrumTransaction } from './chainsource'
import { NewAddress } from './address'
import { getOutputValue } from './output'
import { Config } from '../providers/config'

const cached = {
  blockHeaders: <ElectrumBlockHeader[]>[],
  electrumTxs: <ElectrumTransaction[]>[],
  txHexas: <{ txid: string; hex: string }[]>[],
}

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

const getTransaction = async (txid: string, chainSource: ChainSource): Promise<string> => {
  const inCache = cached.txHexas.find((tx) => tx.txid === txid)
  if (inCache) return inCache.hex
  const hex = await chainSource.fetchSingleTransaction(txid)
  cached.txHexas.push({ txid, hex })
  return hex
}

export const getTransactionAmount = async (address: NewAddress, txHex: string, chainSource: ChainSource) => {
  let amount = 0
  const tx = liquid.Transaction.fromHex(txHex)
  for (const vin of tx.ins) {
    const witnessPubkey = vin.witness[1] ? vin.witness[1].toString('hex') : undefined
    if (witnessPubkey === address.pubkey.toString('hex')) {
      const hex = await getTransaction(Buffer.from(vin.hash).reverse().toString('hex'), chainSource)
      const value = await getOutputValue(vin.index, hex, address.blindingKeys)
      amount -= Number(value)
    }
  }
  for (const [idx, vout] of tx.outs.entries()) {
    if (vout.script.toString('hex') === address.script.toString('hex')) {
      const value = await getOutputValue(idx, txHex, address.blindingKeys)
      amount += Number(value)
    }
  }
  return amount
}
