import ws from 'ws'
import axios from 'axios'
import zkpInit from '@vulpemventures/secp256k1-zkp'
import { Transaction } from 'bitcoinjs-lib'
import { address, crypto, networks } from 'liquidjs-lib'
import { genAddress } from './address'
import { Config } from '../providers/config'
import { Wallet } from '../providers/wallet'
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction,
  detectSwap,
  targetFee,
} from 'boltz-core'
import { randomBytes } from 'crypto'
import { getKeys } from './derivation'
import { decodeInvoice } from './lightning'

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
  const { pubkey } = genAddress(wallet)
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
  const keys = await getKeys(config, wallet)

  // create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(endpoint)
  webSocket.on('open', () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapResponse.id],
      }),
    )
  })

  webSocket.on('message', async (rawMsg: any) => {
    const msg = JSON.parse(rawMsg.toString('utf-8'))
    if (msg.event !== 'update') {
      return
    }

    console.log('Got WebSocket update')
    console.log(msg)
    console.log()

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
  })
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

export const reverseSwap = async (amount: number, preimage: Buffer, config: Config, wallet: Wallet) => {
  // get ecpair from mnemonic
  const keys = await getKeys(config, wallet)

  // get endpoint
  const endpoint = getBoltzApiUrl(config)

  // Create a Submarine Swap
  const swapResponse = (
    await axios.post(`${endpoint}/v2/swap/reverse`, {
      invoiceAmount: Number(amount),
      to: 'L-BTC',
      from: 'BTC',
      claimPublicKey: keys.publicKey.toString('hex'),
      preimageHash: crypto.sha256(preimage).toString('hex'),
    })
  ).data

  console.log('Created swap')
  console.log(swapResponse)
  return { ...swapResponse, preimage }
}

export const finalizeReverseSwap = async (
  preimage: Buffer,
  swapResponse: any,
  config: Config,
  wallet: Wallet,
  onMessage: any,
) => {
  // get next address and respective pubkey
  const destinationAddress = genAddress(wallet).address
  if (!destinationAddress) throw new Error('Unable to generate new address')

  // get endpoint
  const endpoint = getBoltzWsUrl(config)

  // get key pair from mnemonic
  const keys = await getKeys(config, wallet)

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new ws(endpoint)

  webSocket.on('open', () => {
    webSocket.send(
      JSON.stringify({
        op: 'subscribe',
        channel: 'swap.update',
        args: [swapResponse.id],
      }),
    )
  })

  webSocket.on('message', async (rawMsg) => {
    const msg = JSON.parse(rawMsg.toString('utf-8'))
    if (msg.event !== 'update') {
      return
    }

    console.log('Got WebSocket update')
    console.log(msg)
    console.log()

    switch (msg.args[0].status) {
      // "swap.created" means Boltz is waiting for the invoice to be paid
      case 'swap.created': {
        onMessage('Waiting invoice to be paid')
        break
      }

      // "transaction.mempool" means that Boltz send an onchain transaction
      case 'transaction.mempool': {
        onMessage('Creating claim transaction')

        const boltzPublicKey = Buffer.from(swapResponse.refundPublicKey, 'hex')

        // Create a musig signing session and tweak it with the Taptree of the swap scripts
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

        // Create a claim transaction to be signed cooperatively via a key path spend
        const claimTx = targetFee(2, (fee) =>
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
            address.toOutputScript(destinationAddress, networks[config.network]),
            fee,
          ),
        )

        // Get the partial signature from Boltz
        const boltzSig = (
          await axios.post(`${endpoint}/v2/swap/reverse/${swapResponse.id}/claim`, {
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
          claimTx.hashForWitnessV1(0, [swapOutput.script], [swapOutput.value], Transaction.SIGHASH_DEFAULT),
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
        webSocket.close()
        break
    }
  })
}
