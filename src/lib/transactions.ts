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
import { generateAddress } from './address'
import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'
import { blindPset } from './blinder'

const feePerInput = 273
let zkp: Secp256k1ZKP

export const feesToSendSats = (sats: number, wallet: Wallet): number => {
  if (sats === 0) return 0
  const coins = selectCoins(sats, wallet.utxos[wallet.network])
  return feePerInput * coins.length // TODO
}

export const sendSats = async (
  sats: number,
  destinationAddress: string,
  blindingKey: any,
  wallet: Wallet,
): Promise<string> => {
  // check if enough balance
  const utxos = wallet.utxos[wallet.network]
  const balance = getBalance(wallet)
  if (!balance || balance - sats - utxos.length * feePerInput < 0) return ''

  // find best coins combo to pay this
  const iterator = (amount: number): { changeAmount: number; coins: Utxo[]; txfee: number } => {
    const coins = selectCoins(amount, utxos)
    const value = coins.reduce((prev, curr) => prev + curr.value, 0)
    const txfee = coins.length * feePerInput
    const change = value - amount - txfee
    if (change < 0) return iterator(amount + txfee)
    return { changeAmount, coins, txfee }
  }

  const { changeAmount, coins, txfee } = iterator(sats)

  const network = networks[wallet.network]

  const pset = Creator.newPset()
  const updater = new Updater(pset)

  updater
    .addInputs(
      coins.map((coin) => ({
        txid: coin.txid,
        txIndex: coin.vout,
        witnessUtxo: coin.prevout,
        sighashType: Transaction.SIGHASH_ALL,
      })),
    )
    .addOutputs([
      // send to boltz
      {
        amount: sats,
        asset: network.assetHash,
        script: address.toOutputScript(destinationAddress, network),
        blindingPublicKey: Buffer.from(blindingKey, 'hex'),
        blinderIndex: 0,
      },
      // network fees
      {
        amount: txfee,
        asset: network.assetHash,
      },
    ])

  if (changeAmount) {
    const { blindingKeys, script } = await generateAddress(wallet)
    updater.addOutputs([
      {
        amount: changeAmount,
        asset: network.assetHash,
        script,
        blinderIndex: 0,
        blindingPublicKey: blindingKeys.publicKey,
      },
    ])
  }

  console.log('pset input', pset.inputs[0])

  const blindedPset = await blindPset(pset, coins)

  if (!zkp) zkp = await zkpInit()
  const signer = new Signer(blindedPset)
  const keys = await getMnemonicKeys(wallet)

  for (const [index] of signer.pset.inputs.entries()) {
    const sighash = Transaction.SIGHASH_ALL
    const signature = keys.sign(pset.getInputPreimage(index, sighash))
    console.log('pset.getInputPreimage(index, sighash)', pset.getInputPreimage(index, sighash))
    console.log('signature', signature)
    signer.addSignature(
      index,
      {
        partialSig: {
          pubkey: coins[index].pubkey,
          signature: script.signature.encode(signature, sighash),
        },
      },
      Pset.ECDSASigValidator(zkp.ecc),
    )
  }

  const finalizer = new Finalizer(signer.pset)
  finalizer.finalize()
  const txHex = Extractor.extract(finalizer.pset).toHex()

  console.log('sendSats', sats, destinationAddress, coins, changeAmount, txfee)
  console.log('txHex', txHex)
  return 'b29d036678113b2671a308496f06b1665d23ab16b5af8cd126cc8a2273353774' // TODO
}
