import ops from '@boltz/bitcoin-ops'
import { Transaction, TxOutput, confidential, crypto, script } from 'liquidjs-lib'
import { confidentialLiquid } from './init'

/**
 * Get a hex encoded Buffer from a string
 *
 * @returns a hex encoded Buffer
 */
export const getHexBuffer = (input: string): Buffer => {
  return Buffer.from(input, 'hex')
}

/**
 * Get a hex encoded string from a Buffer
 *
 * @returns a hex encoded string
 */
export const getHexString = (input: Buffer): string => {
  return input.toString('hex')
}

export const getOutputValue = (
  output: TxOutput & {
    blindingPrivateKey?: Buffer
  },
): number => {
  return output.blindingPrivateKey && output.rangeProof !== undefined && output.rangeProof.length > 0
    ? Number(confidentialLiquid.unblindOutputWithKey(output, output.blindingPrivateKey).value)
    : confidential.confidentialValueToSatoshi(output.value)
}

const getScriptIntrospectionWitnessScript = (outputScript: Buffer) => outputScript.subarray(2, 40)

export const getScriptIntrospectionValues = (outputScript: Buffer): { version: number; script: Buffer } => {
  const dec = script.decompile(outputScript)!

  switch (dec[0]) {
    case ops.OP_1:
      return {
        version: 1,
        script: getScriptIntrospectionWitnessScript(outputScript),
      }

    case ops.OP_0:
      return {
        version: 0,
        script: getScriptIntrospectionWitnessScript(outputScript),
      }

    default:
      return {
        version: -1,
        script: crypto.sha256(outputScript),
      }
  }
}

interface ITransaction {
  ins: any[]
  virtualSize(): number
}

export const targetFee = <T extends ITransaction = Transaction>(
  satPerVbyte: number,
  constructTx: (fee: number) => T,
): T => {
  const tx = constructTx(1)
  return constructTx(Math.ceil((tx.virtualSize() + tx.ins.length) * satPerVbyte))
}
