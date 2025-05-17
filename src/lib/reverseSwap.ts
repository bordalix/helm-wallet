import zkpInit from '@vulpemventures/secp256k1-zkp'
import axios from 'axios'
import { Transaction, address, crypto } from 'liquidjs-lib'
import { Musig, OutputType, SwapTreeSerializer, detectSwap, targetFee } from 'boltz-core'
import { TaprootUtils, constructClaimTransaction, init } from 'boltz-core/dist/lib/liquid'
import { randomBytes } from 'crypto'
import { ECPairFactory } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { getNetwork } from './network'
import { Wallet } from '../providers/wallet'
import { getBoltzApiUrl, getBoltzWsUrl } from './boltz'
import { claimFees } from './fees'
import { MagicHint } from './lightning'
import { Config } from '../providers/config'
import { ClaimInfo, removeClaim, saveClaim } from './claims'
import { RecvInfo } from '../providers/flow'
import { defaultInvoiceComment } from './constants'
import { hex } from '@scure/base'

/**
 * Reverse swap flow:
 * 1. user generates preimage and sends hash to boltz
 * 2. user generates public key and sends to boltz
 * 3. user receives lightning invoice
 * 4. user validates lightining invoice
 */

interface ReverseSwapBip21Response {
  bip21: string
  signature: string
}

interface ReverseSwapClaimResponse {
  pubNonce: string
  partialSignature: string
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

export enum ReverseSwapStatus {
  InvoiceSettled = 'invoice.settled',
  InvoiceExpired = 'invoice.expired',
  SwapCreated = 'swap.created',
  SwapExpired = 'swap.expired',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionFailed = 'transaction.failed',
  TransactionMempool = 'transaction.mempool',
  TransactionRefunded = 'transaction.refunded',
}

export const waitAndClaim = async (
  claimInfo: ClaimInfo,
  config: Config,
  wallet: Wallet,
  onFinish: (txid: string) => void,
) => {
  init(await zkpInit())
  let claimTx: Transaction
  const network = getNetwork(wallet.network)
  const { createdResponse, destinationAddress, keys, preimage } = claimInfo

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(getBoltzWsUrl(wallet.network, config.tor))
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
    const msg = JSON.parse(rawMsg.data)
    console.log('msg', msg)

    if (msg.event !== 'update') return

    if (msg.args[0].id !== createdResponse.id) return

    if (msg.args[0].error) {
      webSocket.close()
      onFinish('')
      return
    }

    switch (msg.args[0].status) {
      // "swap.created" means Boltz is waiting for the invoice to be paid
      case 'swap.created': {
        console.log('Waiting for invoice to be paid')
        break
      }

      // Boltz's lockup transaction is found in the mempool (or already confirmed)
      // which will only happen after the user paid the Lightning hold invoice
      case 'transaction.mempool':
      case 'transaction.confirmed': {
        // save claim to be able to retry if something fails
        claimInfo.lastStatus = msg.args[0].status
        saveClaim(claimInfo, wallet.network)

        const boltzPublicKey = Buffer.from(createdResponse.refundPublicKey, 'hex')

        // create a musig signing session and tweak it with the Taptree of the swap scripts
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree,
        )

        // parse the lockup transaction and find the output relevant for the swap
        const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex)
        console.log(`Got lockup transaction: ${lockupTx.getId()}`)

        const swapOutput = detectSwap(tweakedKey, lockupTx)
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction')
          return
        }

        console.log('Creating claim transaction')

        // create a claim transaction to be signed cooperatively via a key path spend
        claimTx = targetFee(claimFees(wallet.network), (fee) =>
          constructClaimTransaction(
            [
              {
                ...swapOutput,
                keys,
                preimage,
                cooperative: true,
                type: OutputType.Taproot,
                txHash: lockupTx.getHash(),
                blindingPrivateKey: Buffer.from(createdResponse.blindingKey, 'hex'),
              },
            ],
            address.toOutputScript(destinationAddress, network),
            fee,
            true,
            network,
            address.fromConfidential(destinationAddress).blindingKey,
          ),
        )

        console.log('Getting partial signature from Boltz')

        const boltzSig: ReverseSwapClaimResponse = (
          await axios.post(
            `${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse/${createdResponse.id}/claim`,
            {
              index: 0,
              transaction: claimTx.toHex(),
              preimage: hex.encode(preimage),
              pubNonce: hex.encode(Uint8Array.from(musig.getPublicNonce())),
            },
          )
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

        // save claimtx hex on claimInfo
        claimInfo.claimTx = claimTx.toHex()
        saveClaim(claimInfo, wallet.network)

        console.log('Broadcasting claim transaction')

        await axios.post(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/chain/L-BTC/transaction`, {
          hex: claimTx.toHex(),
        })

        claimInfo.claimed = true
        removeClaim(claimInfo, wallet.network)
        onFinish(claimTx.getId())
        break
      }

      case 'invoice.settled': {
        console.log('Invoice was settled')
        claimInfo.lastStatus = msg.args[0].status
        if (!claimInfo.claimed) saveClaim(claimInfo, wallet.network)
        webSocket.close()
        break
      }

      case 'invoice.expired':
      case 'swap.expired':
      case 'transaction.failed':
      case 'transaction.refunded': {
        console.log(`Removing claim, swap status = ${msg.args[0].status}`, claimInfo)
        removeClaim(claimInfo, wallet.network)
        webSocket.close()
        break
      }
    }
  }
}

export const reverseSwap = async (
  recvInfo: RecvInfo,
  destinationAddress: string,
  config: Config,
  wallet: Wallet,
  onFinish: (txid: string) => void,
  onInvoice: (invoice: string) => void,
) => {
  console.log('recvInfo', recvInfo)
  // create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32)
  const keys = ECPairFactory(ecc).makeRandom()
  const signature = keys.signSchnorr(crypto.sha256(Buffer.from(destinationAddress, 'utf-8')))
  const invoiceAmount = Number(recvInfo.amount)
  const description = recvInfo.comment === '' ? defaultInvoiceComment : recvInfo.comment

  // create a Reverse Submarine Swap
  const createdResponse: ReverseSwapResponse = (
    await axios.post(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse`, {
      address: destinationAddress,
      addressSignature: hex.encode(signature),
      claimPublicKey: hex.encode(keys.publicKey),
      description,
      from: 'BTC',
      invoiceAmount,
      preimageHash: hex.encode(crypto.sha256(preimage)),
      referralId: 'helm',
      to: 'L-BTC',
    })
  ).data

  // Show invoice on wallet UI
  onInvoice(createdResponse.invoice)

  const claimInfo: ClaimInfo = {
    claimed: false,
    claimTx: '',
    createdResponse,
    destinationAddress,
    lastStatus: '',
    preimage,
    keys,
  }

  // Wait for Boltz to lock funds onchain and than claim them
  waitAndClaim(claimInfo, config, wallet, onFinish)
}

export const getLiquidAddress = async (
  invoice: string,
  magicHint: MagicHint,
  config: Config,
  wallet: Wallet,
): Promise<string> => {
  const url = `${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse/${invoice}/bip21`
  const bip21Data = (await axios.get(url)).data as ReverseSwapBip21Response
  const bip21Split = bip21Data.bip21.split(':')
  const bip21Address = bip21Split[1].split('?')[0]

  if (
    !ECPairFactory(ecc)
      .fromPublicKey(Buffer.from(magicHint.pubkey, 'hex'))
      .verifySchnorr(crypto.sha256(Buffer.from(bip21Address, 'utf-8')), Buffer.from(bip21Data.signature, 'hex'))
  ) {
    throw 'BOLTZ IS TRYING TO CHEAT'
  }

  return bip21Address
}
