import axios from 'axios'
import zkpInit from '@vulpemventures/secp256k1-zkp'
import { Transaction, address, confidential, crypto, networks } from 'liquidjs-lib'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import { randomBytes } from 'crypto'
import { generateAddress, getMnemonicKeys } from './wallet'
import { decodeInvoice } from './lightning'
import { ECPairInterface } from 'ecpair'
import { p2shOutput, p2shP2wshOutput, p2wshOutput, p2trOutput } from './boltz/swap/Scripts'
import { constructClaimTransaction } from './boltz/swap/Claim'
import * as TaprootUtils from './boltz/swap/TaprootUtils'
import * as SwapTreeSerializer from './boltz/swap/SwapTreeSerializer'
import { OutputType } from './boltz/consts/Enums'
import Musig from './boltz/musig/Musig'
import { targetFee } from './boltz/Utils'

export const getBoltzApiUrl = ({ network }: Config) =>
  network === 'testnet' ? 'https://testnet.boltz.exchange/api' : 'https://api.boltz.exchange'

export const getBoltzWsUrl = (config: Config) => `${getBoltzApiUrl(config).replace('https://', 'ws://')}/v2/ws`

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
        if (!crypto.sha256(Buffer.from(claimTxDetails.preimage, 'hex')).equals(invoicePreimageHash)) {
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

  const xon = confidential.satoshiToConfidentialValue(1234)
  console.log('xonprefix', xon[0])
  console.log('xon', xon)
  console.log('xonhex', xon.toString('hex'))
  console.log('back', confidential.confidentialValueToSatoshi(xon))

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
  destinationAddress: string,
  swapResponse: ReverseSwapResponse,
  keys: ECPairInterface,
  config: Config,
  onMessage: any,
) => {
  const network = networks[config.network]

  const confidentialLiquid = new confidential.Confidential((await zkpInit()) as any)

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
        onMessage('Waiting for invoice to be paid')
        break
      }

      // "transaction.mempool" means that Boltz send an onchain transaction
      case 'transaction.mempool': {
        onMessage('Creating claim transaction')

        const boltzPublicKey = Buffer.from(swapResponse.refundPublicKey, 'hex')

        // Create a musig signing session and tweak it with the Taptree of the swap script
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(swapResponse.swapTree).tree,
        )

        // Parse the lockup transaction and find the output relevant for the swap
        const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex)
        const swapOutput = detectSwap(tweakedKey, lockupTx)
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction')
          return
        }

        const { asset, value } = confidentialLiquid.unblindOutputWithKey(
          swapOutput,
          Buffer.from(swapResponse.blindingKey, 'hex'),
        )

        console.log('value, asset', value, asset)
        const unblindedSwapOutput = {
          ...swapOutput,
          asset,
          rangeProof: undefined,
          surjectionProof: undefined,
          value: confidential.satoshiToConfidentialValue(Number(value)),
        }

        // Create a claim transaction to be signed cooperatively via a key path spend
        const claimTx = targetFee(2, (fee: any) =>
          constructClaimTransaction(
            [
              {
                ...unblindedSwapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
                blindingPrivateKey: Buffer.from(swapResponse.blindingKey, 'hex'),
              },
            ],
            address.toOutputScript(destinationAddress, network),
            fee,
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
            Transaction.SIGHASH_DEFAULT,
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
        break
    }
  }
}

export const detectSwap = (redeemScriptOrTweakedKey: Buffer, transaction: Transaction) => {
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
