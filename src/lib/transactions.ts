import { getBalance } from './wallet'
import { Wallet } from '../providers/wallet'
import { selectCoins } from './coinSelection'
import { blindPset } from './blinder'
import { buildPset } from './pset'
import { signPset } from './signer'
import { finalizeAndBroadcast } from './finalizer'
import { feeForCoins } from './fees'

export const feesToSendSats = (sats: number, wallet: Wallet): number => {
  if (sats === 0) return 0
  const { coins } = selectCoins(sats, wallet.utxos[wallet.network])
  return feeForCoins(coins.length)
}

export const sendSats = async (sats: number, destinationAddress: string, wallet: Wallet): Promise<string> => {
  // check if enough balance
  const utxos = wallet.utxos[wallet.network]
  const balance = getBalance(wallet)
  if (!balance || balance - sats - feeForCoins(utxos.length) < 0) return ''

  // select coins, build pset, blind it, sign it and broadcast it
  const coinSelection = selectCoins(sats, utxos)
  const pset = await buildPset(coinSelection, destinationAddress, wallet)
  const blindedPset = await blindPset(pset, coinSelection.coins)
  const signedPset = await signPset(blindedPset, coinSelection.coins, wallet)
  const txid = await finalizeAndBroadcast(signedPset, wallet)

  return txid
}
