import { Utxo } from './types'
import { getBalance, getMnemonicKeys } from './wallet'
import { Wallet } from '../providers/wallet'
import { selectCoins } from './coinSelection'
import {
  Creator,
  Extractor,
  Finalizer,
  Pset,
  Signer,
  Transaction,
  Updater,
  address,
  networks,
  script,
} from 'liquidjs-lib'
import { Config } from '../providers/config'
import { generateAddress } from './address'
import zkpLib from '@vulpemventures/secp256k1-zkp'
import { satoshiToConfidentialValue } from 'liquidjs-lib/src/confidential'
import { getScriptType } from 'liquidjs-lib/src/address'

const feePerInput = 273

export const feesToSendSats = (sats: number, wallet: Wallet): number => {
  if (sats === 0) return 0
  const coins = selectCoins(sats, wallet.utxos)
  return feePerInput * coins.length // TODO
}

export const sendSats = async (
  sats: number,
  destinationAddress: string,
  config: Config,
  wallet: Wallet,
): Promise<string> => {
  // check if enough balance
  const balance = getBalance(wallet)
  if (!balance || balance - sats - wallet.utxos.length * feePerInput < 0) return ''

  // find best coins combo to pay this
  const iterator = (amount: number): { change: number; coins: Utxo[]; txfee: number } => {
    const coins = selectCoins(amount, wallet.utxos)
    const value = coins.reduce((prev, curr) => prev + curr.value, 0)
    const txfee = coins.length * feePerInput
    const change = value - amount - txfee
    console.log(amount, value, txfee, change)
    if (change < 0) return iterator(amount + txfee)
    return { change, coins, txfee }
  }

  const { change, coins, txfee } = iterator(sats)

  const network = networks[config.network]

  const pset = Creator.newPset()
  const updater = new Updater(pset)

  updater
    .addInputs(
      coins.map((coin) => ({
        txid: coin.txid,
        txIndex: coin.vout,
        witnessUtxo: { ...coin, value: satoshiToConfidentialValue(coin.value) },
        sighashType: Transaction.SIGHASH_ALL,
      })),
    )
    .addOutputs([
      // send to boltz
      {
        amount: sats,
        asset: network.assetHash,
        script: address.toOutputScript(destinationAddress, network),
      },
      // network fees
      {
        amount: txfee,
        asset: network.assetHash,
      },
    ])

  if (change) {
    updater.addOutputs([
      {
        amount: change,
        asset: network.assetHash,
        script: (await generateAddress(wallet, 1)).script,
      },
    ])
  }

  console.log('pset input', pset.inputs[0].witnessUtxo?.script)
  console.log('gst', getScriptType(pset.inputs[0].witnessUtxo?.script!))

  const signer = new Signer(pset)
  const ecc = (await zkpLib()).ecc
  const keys = await getMnemonicKeys(config, wallet)

  for (const [index] of signer.pset.inputs.entries()) {
    const sighash = Transaction.SIGHASH_ALL // '||' lets to overwrite SIGHASH_DEFAULT (0x00)
    const signature = keys.sign(pset.getInputPreimage(index, sighash))
    signer.addSignature(
      index,
      {
        partialSig: {
          pubkey: keys.publicKey,
          signature: script.signature.encode(signature, sighash),
        },
      },
      Pset.ECDSASigValidator(ecc),
    )
  }

  const finalizer = new Finalizer(signer.pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()

  console.log('sendSats', sats, destinationAddress, coins, change, txfee)
  console.log('txHex', txHex)
  return 'b29d036678113b2671a308496f06b1665d23ab16b5af8cd126cc8a2273353774' // TODO
}
