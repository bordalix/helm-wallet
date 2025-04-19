import { prettyUnixTimestamp } from './format'
import { Transaction, Utxo } from './types'
import { ChainSource } from './chainsource'
import { getTransactionAmount } from './transactions'
import { getUnblindedOutput } from './output'
import { AddressesHistory, getCachedBlockHeader, getCachedElectrumTransactions } from './cache'
import { hex } from '@scure/base'

export const restore = async (chainSource: ChainSource, histories: AddressesHistory[], update?: () => void) => {
  const transactions: Transaction[] = []
  const utxos: Utxo[] = []
  const lastIndex = histories.reduce((prev, curr) => (curr.address.nextIndex > prev ? curr.address.nextIndex : prev), 0)

  for (const h of histories) {
    const { address, history } = h
    const txs = await getCachedElectrumTransactions(history, chainSource)

    for (const tx of txs) {
      const timestamp = tx.height > 0 ? (await getCachedBlockHeader(tx.height, chainSource)).timestamp : 0
      const amount = await getTransactionAmount(address, tx.hex, chainSource)
      const existingTx = transactions.find((t) => t.txid === tx.tx_hash)
      if (existingTx) existingTx.amount += amount
      else {
        transactions.push({
          amount,
          date: prettyUnixTimestamp(timestamp),
          hex: tx.hex,
          txid: tx.tx_hash,
          unixdate: timestamp,
        })
      }
    }

    const listUtxos = await chainSource.listUtxos(address.script)

    for (const u of listUtxos) {
      const txHex = transactions.find((t) => t.txid === u.txid)?.hex
      if (!txHex) {
        // eslint-disable-next-line no-console
        console.warn('Unknown txHex for txid', u.txid)
        continue
      }
      const unblinded = await getUnblindedOutput(u.vout, txHex, address.blindingKeys)
      utxos.push({
        ...u,
        ...unblinded,
        address: address.address,
        asset: hex.encode(Uint8Array.from(unblinded.asset).reverse()),
        blindingPublicKey: address.blindingKeys.publicKey,
        blindingPrivateKey: address.blindingKeys.privateKey,
        nextIndex: address.nextIndex,
        pubkey: address.pubkey,
        script: address.script,
        value: Number(unblinded.value),
      })
    }

    if (update) update()
  }

  const uniqueTx = transactions
    .filter((value, index, self) => index === self.findIndex((t) => t.txid === value.txid))
    .map(({ amount, date, txid, unixdate }) => ({ amount, date, txid, unixdate }))

  return { nextIndex: lastIndex + 1, transactions: uniqueTx, utxos }
}
