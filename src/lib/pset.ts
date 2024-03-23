import { networks, Creator, Updater, Transaction, address } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { Utxo } from './types'

export const buildPset = async (coinSelection: any, destinationAddress: string, wallet: Wallet) => {
  const network = networks[wallet.network]
  const { amount, changeAmount, coins, txfee } = coinSelection

  const pset = Creator.newPset()
  const updater = new Updater(pset)

  updater
    .addInputs(
      coins.map((coin: Utxo) => ({
        txid: coin.txid,
        txIndex: coin.vout,
        witnessUtxo: coin.prevout,
        sighashType: Transaction.SIGHASH_ALL,
      })),
    )
    .addOutputs([
      // send to boltz
      {
        amount,
        asset: network.assetHash,
        script: address.toOutputScript(destinationAddress, network),
        blindingPublicKey: address.fromConfidential(destinationAddress).blindingKey,
        blinderIndex: 0,
      },
      // network fees
      {
        amount: txfee,
        asset: network.assetHash,
      },
    ])

  if (changeAmount) {
    const changeAddress = await generateAddress(wallet)
    updater.addOutputs([
      {
        amount: changeAmount,
        asset: network.assetHash,
        script: changeAddress.script,
        blinderIndex: 0,
        blindingPublicKey: changeAddress.blindingKeys.publicKey,
      },
    ])
  }

  return pset
}
