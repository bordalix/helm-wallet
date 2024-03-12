import axios from 'axios'
import zkpInit, { Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'
import * as liquid from 'liquidjs-lib'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { randomBytes } from 'crypto'
import { getMnemonicKeys } from './wallet'
import { decodeInvoice } from './lightning'
import { ECPairInterface } from 'ecpair'
import { generateAddress } from './address'
import { createMusig, hashForWitnessV1, tweakMusig } from './taproot/musig'
import { TransactionInterface, getPartialReverseClaimSignature } from './boltzClient'
import {
  ClaimDetails,
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  TransactionOutput,
  detectSwap,
  targetFee,
} from 'boltz-core'
import { DecodedAddress, LiquidTransactionOutputWithKey } from './types'
import { LiquidClaimDetails, constructClaimTransaction } from 'boltz-core/dist/lib/liquid'
import { networks } from 'liquidjs-lib'
import { p2shOutput, p2shP2wshOutput, p2trOutput, p2wshOutput } from 'boltz-core/dist/lib/swap/Scripts'

export const getBoltzApiUrl = ({ network }: Config) =>
  network === 'testnet' ? 'https://testnet.boltz.exchange/api' : 'https://api.boltz.exchange'

export const getBoltzWsUrl = (config: Config) => `${getBoltzApiUrl(config).replace('https://', 'ws://')}/v2/ws`

export const parseBlindingKey = (swap: { blindingKey: string | undefined }) => {
  return swap.blindingKey ? Buffer.from(swap.blindingKey, 'hex') : undefined
}

const getOutputAmount = (output: TransactionOutput | LiquidTransactionOutputWithKey, secp: Secp256k1ZKP): number => {
  output = output as LiquidTransactionOutputWithKey
  const confi = new liquid.confidential.Confidential(secp as liquid.Secp256k1Interface)
  if (output.rangeProof?.length !== 0 && output.blindingPrivateKey) {
    const unblinded = confi.unblindOutputWithKey(output, output.blindingPrivateKey)
    return Number(unblinded.value)
  } else {
    return liquid.confidential.confidentialValueToSatoshi(output.value)
  }
}

const getConstructClaimTransaction = (config: Config) => {
  return (
    utxos: ClaimDetails[] | LiquidClaimDetails[],
    destinationScript: Buffer,
    fee: number,
    isRbf?: boolean,
    blindingKey?: Buffer,
  ) => {
    return constructClaimTransaction(
      utxos as LiquidClaimDetails[],
      destinationScript,
      fee,
      isRbf,
      networks[config.network],
      blindingKey,
    )
  }
}

export interface SubmarineSwapResponse {
  id: string
  bip21: string
  address: string
  swapTree: {
    claimLeaf: {
      version: number
      output: string
    }
    refundLeaf: {
      version: number
      output: string
    }
  }
  blindingKey: string
  acceptZeroConf: boolean
  expectedAmount: number
  claimPublicKey: string
  timeoutBlockHeight: number
}

export const submarineSwap = async (
  invoice: string,
  config: Config,
  wallet: Wallet,
): Promise<SubmarineSwapResponse> => {
  // get next address and respective pubkey
  const { pubkey } = await generateAddress(wallet)
  if (!pubkey) throw new Error('Unable to generate new address')

  // get endpoint
  const endpoint = getBoltzApiUrl(config)

  // create a Submarine Swap
  const swapResponse = (
    await axios.post(`${endpoint}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'L-BTC',
      refundPublicKey: pubkey.toString('hex'),
    })
  ).data

  console.log('Created swap')
  console.log(swapResponse)
  return swapResponse
}

export const finalizeSubmarineSwap = async (
  invoice: string,
  swapResponse: any,
  config: Config,
  wallet: Wallet,
  onMessage: any,
) => {
  // get endpoint
  const endpoint = getBoltzWsUrl(config)

  // get key pair from mnemonic
  const keys = await getMnemonicKeys(config, wallet)

  // create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(endpoint)

  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapResponse.id],
      }),
    )
  }

  webSocket.onmessage = async (rawMsg: any) => {
    const msg = JSON.parse(rawMsg.data.toString('utf-8'))
    if (msg.event !== 'update') {
      return
    }

    switch (msg.args[0].status) {
      // "invoice.set" means Boltz is waiting for an onchain transaction to be sent
      case 'invoice.set': {
        onMessage('Waiting for onchain transaction')
        break
      }

      // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
      case 'transaction.claim.pending': {
        onMessage('Creating cooperative claim transaction')

        // Get the information request to create a partial signature
        const claimTxDetails = (await axios.get(`${endpoint}/v2/swap/submarine/${swapResponse.id}/claim`)).data

        // Verify that Boltz actually paid the invoice by comparing the preimage hash
        // of the invoice to the SHA256 hash of the preimage from the response
        const invoicePreimageHash = Buffer.from(decodeInvoice(invoice).paymentHash, 'hex')
        if (!liquid.crypto.sha256(Buffer.from(claimTxDetails.preimage, 'hex')).equals(invoicePreimageHash)) {
          onMessage('Boltz provided invalid preimage')
          return
        }

        const boltzPublicKey = Buffer.from(swapResponse.claimPublicKey, 'hex')

        // Create a musig signing instance
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        // Tweak that musig with the Taptree of the swap scripts
        TaprootUtils.tweakMusig(musig, SwapTreeSerializer.deserializeSwapTree(swapResponse.swapTree).tree)

        // Aggregate the nonces
        musig.aggregateNonces([[boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, 'hex')]])
        // Initialize the session to sign the transaction hash from the response
        musig.initializeSession(Buffer.from(claimTxDetails.transactionHash, 'hex'))

        // Give our public nonce and the partial signature to Boltz
        await axios.post(`${endpoint}/v2/swap/submarine/${swapResponse.id}/claim`, {
          pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
          partialSignature: Buffer.from(musig.signPartial()).toString('hex'),
        })

        break
      }

      case 'transaction.claimed':
        onMessage('Swap successful')
        webSocket.close()
        break
    }
  }
}

export interface ReverseSwapResponse {
  id: string
  invoice: string
  swapTree: {
    claimLeaf: {
      version: number
      output: string
    }
    refundLeaf: {
      version: number
      output: string
    }
  }
  blindingKey: string
  lockupAddress: string
  onchainAmount: number
  refundPublicKey: string
  timeoutBlockHeight: number
}

export const reverseSwap = async (
  amount: number,
  preimageHash: string,
  claimPublicKey: string,
  config: Config,
): Promise<ReverseSwapResponse> => {
  // get endpoint
  const endpoint = getBoltzApiUrl(config)

  // create a Submarine Swap
  const swapResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount: Number(amount),
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey,
      preimageHash,
    })
  ).data

  return swapResponse
}

export const finalizeReverseSwap = async (
  preimage: Buffer,
  swapResponse: ReverseSwapResponse,
  keys: ECPairInterface,
  config: Config,
  wallet: Wallet,
  onFinish: (msg: string) => void,
): Promise<void> => {
  let claimTx: liquid.Transaction
  const network = liquid.networks[config.network]

  const nextAddress = await generateAddress(wallet)
  const destinationScript = nextAddress.script
  if (!destinationScript) throw Error('Unable to generate new address')

  // create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(getBoltzWsUrl(config))

  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapResponse.id],
      }),
    )
  }

  webSocket.onmessage = async (rawMsg: any) => {
    const msg = JSON.parse(rawMsg.data.toString('utf-8'))

    if (msg.event !== 'update') return

    switch (msg.args[0].status) {
      case 'swap.created': {
        console.log('Waiting for invoice to be paid')
        break
      }

      // "transaction.mempool" means that Boltz send an onchain transaction
      case 'transaction.mempool': {
        console.log('Creating claim transaction')

        const boltzPublicKey = Buffer.from(swapResponse.refundPublicKey, 'hex')

        // Create a musig signing session and tweak it with the Taptree of the swap script
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(swapResponse.swapTree).tree,
        )

        // Parse the lockup transaction and find the output relevant for the swap
        const lockupTx = liquid.Transaction.fromHex(msg.args[0].transaction.hex)
        const swapOutput = detectSwap(tweakedKey, lockupTx)
        console.log('swapOutput', swapOutput)
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction')
          return
        }

        // Create a claim transaction to be signed cooperatively via a key path spend
        claimTx = targetFee(2, (fee: any) =>
          constructClaimTransaction(
            [
              {
                ...swapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
                blindingPrivateKey: Buffer.from(swapResponse.blindingKey, 'hex'),
              },
            ],
            destinationScript,
            fee,
            true,
            network,
            nextAddress.blindingKeys.publicKey,
          ),
        )

        // Get the partial signature from Boltz
        const boltzSig = (
          await axios.post(`${getBoltzApiUrl(config)}/v2/swap/reverse/${swapResponse.id}/claim`, {
            index: 0,
            transaction: claimTx.toHex(),
            preimage: preimage.toString('hex'),
            pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
          })
        ).data

        // Aggregate the nonces
        musig.aggregateNonces([[boltzPublicKey, Buffer.from(boltzSig.pubNonce, 'hex')]])

        // Initialize the session to sign the claim transaction
        musig.initializeSession(
          claimTx.hashForWitnessV1(
            0,
            [swapOutput.script],
            [{ value: swapOutput.value, asset: swapOutput.asset }],
            liquid.Transaction.SIGHASH_DEFAULT,
            network.genesisBlockHash,
          ),
        )

        // Add the partial signature from Boltz
        musig.addPartial(boltzPublicKey, Buffer.from(boltzSig.partialSignature, 'hex'))

        // Create our partial signature
        musig.signPartial()

        // Witness of the input to the aggregated signature
        claimTx.ins[0].witness = [musig.aggregatePartials()]

        // Broadcast the finalized transaction
        console.log('tx', claimTx.toHex())
        await axios.post(`${getBoltzApiUrl(config)}/v2/chain/L-BTC/transaction`, {
          hex: claimTx.toHex(),
        })

        break
      }

      case 'invoice.settled':
        console.log('Swap successful')
        webSocket.close()
        onFinish(claimTx.getId())

        break
    }
  }
}

export const detectSwapold = (redeemScriptOrTweakedKey: Buffer, transaction: liquid.Transaction) => {
  const scripts: [OutputType, Buffer][] = [
    [OutputType.Legacy, p2shOutput(redeemScriptOrTweakedKey)],
    [OutputType.Compatibility, p2shP2wshOutput(redeemScriptOrTweakedKey)],
    [OutputType.Bech32, p2wshOutput(redeemScriptOrTweakedKey)],
    [OutputType.Taproot, p2trOutput(redeemScriptOrTweakedKey)],
  ]
  console.log('redeemScriptOrTweakedKey', redeemScriptOrTweakedKey.toString('hex'))
  scripts.map(([t, s]) => console.log('xx', t, s.toString('hex')))

  for (const [vout, output] of transaction.outs.entries()) {
    console.log('received', output.script.toString('hex'))
    const scriptMatch = scripts.find(([, script]) => {
      return script.equals(output.script)
    })

    if (scriptMatch) {
      return {
        vout,
        type: scriptMatch[0],
        ...output,
      }
    }
  }
  return
}

const createAdjustedClaim = <T extends (ClaimDetails & { blindingPrivateKey?: Buffer }) | LiquidClaimDetails>(
  swap: any,
  claimDetails: T[],
  destination: Buffer,
  secp: Secp256k1ZKP,
  blindingKey?: Buffer,
) => {
  const inputSum = claimDetails.reduce((total: number, input: T) => total + getOutputAmount(input, secp), 0)
  const feeBudget = Math.floor(inputSum - swap.receiveAmount)

  const constructClaimTransaction = getConstructClaimTransaction(swap.asset)
  return constructClaimTransaction(
    claimDetails as ClaimDetails[] | LiquidClaimDetails[],
    destination,
    feeBudget,
    true,
    blindingKey,
  )
}

const claimTaproot = async (
  swap: any,
  lockupTx: TransactionInterface,
  privateKey: ECPairInterface,
  preimage: Buffer,
  decodedAddress: DecodedAddress,
  cooperative = true,
  config: Config,
): Promise<any> => {
  const secp = await zkpInit()
  const boltzPublicKey = Buffer.from(swap.refundPublicKey, 'hex')
  const musig = createMusig(privateKey, boltzPublicKey, secp)
  const tree = SwapTreeSerializer.deserializeSwapTree(swap.swapTree)
  const tweakedKey = tweakMusig(swap.asset, musig, tree.tree)

  const swapOutput = detectSwap(tweakedKey, lockupTx)
  if (!swapOutput) throw Error('xxx')

  const details = [
    {
      ...swapOutput,
      cooperative,
      swapTree: tree,
      keys: privateKey,
      preimage: preimage,
      type: OutputType.Taproot,
      txHash: lockupTx.getHash(),
      blindingPrivateKey: parseBlindingKey(swap),
      internalKey: musig.getAggregatedPublicKey(),
    },
  ] as (ClaimDetails & { blindingPrivateKey: Buffer })[]
  const claimTx = createAdjustedClaim(swap, details, decodedAddress.script, secp, decodedAddress.blindingKey)

  if (!cooperative) {
    return claimTx
  }

  try {
    const boltzSig = await getPartialReverseClaimSignature(
      swap.asset,
      swap.id,
      preimage,
      Buffer.from(musig.getPublicNonce()),
      claimTx,
      0,
    )

    musig.aggregateNonces([[boltzPublicKey, boltzSig.pubNonce]])
    musig.initializeSession(hashForWitnessV1(swap.asset, networks[config.network], details, claimTx, 0))
    musig.signPartial()
    musig.addPartial(boltzPublicKey, boltzSig.signature)

    claimTx.ins[0].witness = [musig.aggregatePartials()]

    return claimTx
  } catch (e) {
    console.log('Uncooperative Taproot claim because', e)
    return claimTaproot(swap, lockupTx, privateKey, preimage, decodedAddress, false, config)
  }
}
