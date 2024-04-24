import { networks, Creator, Updater, Transaction, address, UpdaterOutput } from 'liquidjs-lib'
import { Wallet } from '../providers/wallet'
import { generateAddress } from './address'
import { Utxo } from './types'
import { CoinsSelected } from './coinSelection'

export const buildPset = async (coinSelection: CoinsSelected, destinationAddress: string, wallet: Wallet) => {
  const network = networks[wallet.network]
  const { amount, changeAmount, coins, txfee } = coinSelection

  let boltzOutput: UpdaterOutput = {
    amount,
    asset: network.assetHash,
    script: address.toOutputScript(destinationAddress, network),
  }

  if (address.isConfidential(destinationAddress)) {
    boltzOutput = {
      ...boltzOutput,
      blindingPublicKey: address.fromConfidential(destinationAddress).blindingKey,
      blinderIndex: 0,
    }
  }

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
      boltzOutput,
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
