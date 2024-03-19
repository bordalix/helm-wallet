import zkpInit from '@vulpemventures/secp256k1-zkp'
import axios from 'axios'
import { Transaction, crypto, initEccLib } from 'bitcoinjs-lib'
import { Musig, OutputType, SwapTreeSerializer, detectSwap, targetFee } from 'boltz-core'
import { randomBytes } from 'crypto'
import { ECPairFactory } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { generateAddress } from './address'
import { Wallet } from '../providers/wallet'
import { Config } from '../providers/config'
import * as liquid from 'liquidjs-lib'
import { TaprootUtils, constructClaimTransaction } from 'boltz-core/dist/lib/liquid'
import bolt11 from 'bolt11'
import { SendInfo } from '../providers/flow'
import { getBoltzApiUrl, getBoltzWsUrl } from './boltz'
import { sendSats } from './transactions'
import { NetworkName } from './network'

/**
 * Submarine swap flow:
 * 1. user sends invoice to be paid to boltz
 * 2. user generates and sends refund public key to boltz
 * 3. user receives liquid address where to send funds
 * 4. user validates lightining invoice
 */

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
  invoice: any,
  refundPublicKey: string,
  network: NetworkName,
): Promise<SubmarineSwapResponse> => {
  // Create a Submarine Swap
  const swapResponse: SubmarineSwapResponse = (
    await axios.post(`${getBoltzApiUrl(network)}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'L-BTC',
      refundPublicKey,
    })
  ).data

  console.log('Created swap')
  console.log(swapResponse)
  return swapResponse
}

export const finalizeSubmarineSwap = (
  sendInfo: SendInfo,
  config: Config,
  wallet: Wallet,
  onTxid: (txid: string) => void,
) => {
  const { invoice, keys, swapResponse } = sendInfo
  if (!invoice || !keys || !swapResponse) return

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(getBoltzWsUrl(wallet.network))
  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapResponse.id],
      }),
    )
  }

  webSocket.onmessage = async (rawMsg) => {
    let msg

    try {
      msg = JSON.parse(rawMsg.data)
    } catch (_) {
      return
    }

    if (msg.event !== 'update') {
      return
    }

    console.log('Got WebSocket update')
    console.log(msg)
    console.log()

    switch (msg.args[0].status) {
      // "invoice.set" means Boltz is waiting for an onchain transaction to be sent
      case 'invoice.set': {
        console.log('Waiting for onchain transaction')
        sendSats(swapResponse.expectedAmount, swapResponse.address, wallet)
        break
      }

      // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
      case 'transaction.claim.pending': {
        console.log('Creating cooperative claim transaction')

        // Get the information request to create a partial signature
        const claimTxDetails = (
          await axios.get(`${getBoltzApiUrl(wallet.network)}/v2/swap/submarine/${swapResponse.id}/claim`)
        ).data

        // Verify that Boltz actually paid the invoice by comparing the preimage hash
        // of the invoice to the SHA256 hash of the preimage from the response
        const invoicePreimageHash = Buffer.from(
          bolt11.decode(invoice).tags.find((tag) => tag.tagName === 'payment_hash')!.data as string,
          'hex',
        )
        if (!crypto.sha256(Buffer.from(claimTxDetails.preimage, 'hex')).equals(invoicePreimageHash)) {
          console.error('Boltz provided invalid preimage')
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
        await axios.post(`${getBoltzApiUrl(wallet.network)}/v2/swap/submarine/${swapResponse.id}/claim`, {
          pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
          partialSignature: Buffer.from(musig.signPartial()).toString('hex'),
        })

        break
      }

      case 'transaction.claimed':
        console.log('Swap successful')
        webSocket.close()
        onTxid('b29d036678113b2671a308496f06b1665d23ab16b5af8cd126cc8a2273353774')
        break
    }
  }
}

/**
 * Reverse swap flow:
 * 1. user generates preimage and sends hash to boltz
 * 2. user generates public key and sends to boltz
 * 3. user receives lightning invoice
 * 4. user validates lightining invoice
 */

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

export const reverseSwap2 = async (
  invoiceAmount: number,
  config: Config,
  wallet: Wallet,
  onFinish: (txid: string) => void,
  onInvoice: (invoice: string) => void,
) => {
  initEccLib(ecc)

  // Endpoint of the Boltz instance to be used
  const endpoint = getBoltzApiUrl(wallet.network)
  const network = liquid.networks[wallet.network]

  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32)
  const keys = ECPairFactory(ecc).makeRandom()

  // Address to which the swap should be claimed
  const destinationAddress = (await generateAddress(wallet)).confidentialAddress
  let claimTx: liquid.Transaction

  // Create a reverse swap
  const createdResponse: ReverseSwapResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount,
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: keys.publicKey.toString('hex'),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data

  onInvoice(createdResponse.invoice)
  console.log('Created swap')
  console.log(createdResponse)
  console.log()

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(getBoltzWsUrl(wallet.network))
  webSocket.onopen = () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [createdResponse.id],
      }),
    )
  }

  webSocket.onmessage = async (rawMsg) => {
    console.log('rawMsg', rawMsg)
    const msg = JSON.parse(rawMsg.data)
    if (msg.event !== 'update') {
      return
    }

    console.log('Got WebSocket update')
    console.log(msg)
    console.log()

    switch (msg.args[0].status) {
      // "swap.created" means Boltz is waiting for the invoice to be paid
      case 'swap.created': {
        console.log('Waiting invoice to be paid')
        break
      }

      // "transaction.mempool" means that Boltz send an onchain transaction
      case 'transaction.mempool': {
        console.log('Creating claim transaction')

        const boltzPublicKey = Buffer.from(createdResponse.refundPublicKey, 'hex')

        // Create a musig signing session and tweak it with the Taptree of the swap scripts
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree,
        )

        // Parse the lockup transaction and find the output relevant for the swap
        const lockupTx = liquid.Transaction.fromHex(msg.args[0].transaction.hex)
        const swapOutput = detectSwap(tweakedKey, lockupTx)
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction')
          return
        }

        // Create a claim transaction to be signed cooperatively via a key path spend
        claimTx = targetFee(2, (fee) =>
          constructClaimTransaction(
            [
              {
                ...swapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
              },
            ],
            liquid.address.toOutputScript(destinationAddress, network),
            fee,
          ),
        )

        // Get the partial signature from Boltz
        const boltzSig = (
          await axios.post(`${endpoint}/v2/swap/reverse/${createdResponse.id}/claim`, {
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
            [{ asset: swapOutput.asset, value: swapOutput.value }],
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
        await axios.post(`${endpoint}/v2/chain/BTC/transaction`, {
          hex: claimTx.toHex(),
        })

        break
      }

      case 'invoice.settled':
        console.log('Swap successful')
        onFinish(claimTx.getId())
        webSocket.close()
        break
    }
  }
}
