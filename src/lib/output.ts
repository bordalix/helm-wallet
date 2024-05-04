import { AssetHash, ElementsValue, Transaction } from 'liquidjs-lib'
import { BlindingKeyPair, unblindOutput } from './blinder'
import { UnblindedOutput } from './types'
import { Output } from 'liquidjs-lib/src/transaction'

const isUnblinded = (output: Output) => output.value.length < 33

const fromBytes = (value: Buffer) => ElementsValue.fromBytes(value).number

export const getOutputValue = async (
  index: number,
  txHex: string,
  blindingKeyPair: BlindingKeyPair,
): Promise<Number> => {
  const tx = Transaction.fromHex(txHex)
  const output = tx.outs[index]
  if (isUnblinded(output)) return fromBytes(output.value)
  const { value } = await unblindOutput(index, txHex, blindingKeyPair)
  return Number(value)
}

export const getUnblindedOutput = async (
  index: number,
  txHex: string,
  blindingKeys: BlindingKeyPair,
): Promise<UnblindedOutput> => {
  const tx = Transaction.fromHex(txHex)
  const output = tx.outs[index]
  if (isUnblinded(output)) {
    return {
      asset: AssetHash.fromBytes(output.asset).bytesWithoutPrefix,
      prevout: output,
      value: fromBytes(output.value).toString(10),
    }
  }
  return await unblindOutput(index, txHex, blindingKeys)
}
