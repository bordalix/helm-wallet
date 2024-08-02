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
import { satsVbyte } from './fees'
import { MagicHint } from './lightning'
import { Config } from '../providers/config'
import { ClaimInfo, removeClaim, saveClaim } from './claims'
import { RecvInfo } from '../providers/flow'

/**
 * Reverse swap flow:
 * 1. user generates preimage and sends hash to boltz
 * 2. user generates public key and sends to boltz
 * 3. user receives lightning invoice
 * 4. user validates lightining invoice
 */

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

  const closeAndRemoveClaim = () => {
    removeClaim(claimInfo, wallet.network)
    onFinish(claimTx ? claimTx.getId() : '')
    webSocket.close()
  }

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
    const msg = JSON.parse(rawMsg.data)
    console.log('msg', msg)

    if (msg.event !== 'update') return

    if (msg.args[0].id !== createdResponse.id) return

    if (msg.args[0].error) return closeAndRemoveClaim()

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
        // save claim to retry later if claim tx fails
        saveClaim(claimInfo, wallet.network)

        const boltzPublicKey = Buffer.from(createdResponse.refundPublicKey, 'hex')

        // Create a musig signing session and tweak it with the Taptree of the swap scripts
        const musig = new Musig(await zkpInit(), keys, randomBytes(32), [boltzPublicKey, keys.publicKey])
        const tweakedKey = TaprootUtils.tweakMusig(
          musig,
          SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree,
        )

        // Parse the lockup transaction and find the output relevant for the swap
        const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex)
        console.log(`Got lockup transaction: ${lockupTx.getId()}`)

        const swapOutput = detectSwap(tweakedKey, lockupTx)
        if (swapOutput === undefined) {
          console.error('No swap output found in lockup transaction')
          return
        }

        console.log('Creating claim transaction')

        // Create a claim transaction to be signed cooperatively via a key path spend
        claimTx = targetFee(satsVbyte, (fee) =>
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

        // Get the partial signature from Boltz
        const boltzSig = (
          await axios.post(
            `${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse/${createdResponse.id}/claim`,
            {
              index: 0,
              transaction: claimTx.toHex(),
              preimage: preimage.toString('hex'),
              pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
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

        // Broadcast the finalized transaction
        await axios.post(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/chain/L-BTC/transaction`, {
          hex: claimTx.toHex(),
        })

        break
      }

      case 'invoice.settled': {
        console.log()
        console.log('Swap successful!')
        closeAndRemoveClaim()
        break
      }
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
  recvInfo: RecvInfo,
  destinationAddress: string,
  config: Config,
  wallet: Wallet,
  onFinish: (txid: string) => void,
  onInvoice: (invoice: string) => void,
) => {
  // Create a random preimage for the swap; has to have a length of 32 bytes
  const preimage = randomBytes(32)
  const keys = ECPairFactory(ecc).makeRandom()
  const signature = keys.signSchnorr(crypto.sha256(Buffer.from(destinationAddress, 'utf-8')))
  const invoiceAmount = Number(recvInfo.amount)

  // Create a Reverse Submarine Swap
  const createdResponse = (
    await axios.post(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse`, {
      address: destinationAddress,
      addressSignature: signature.toString('hex'),
      claimPublicKey: keys.publicKey.toString('hex'),
      description: recvInfo.note,
      from: 'BTC',
      invoiceAmount,
      preimageHash: crypto.sha256(preimage).toString('hex'),
      referralId: 'helm',
      to: 'L-BTC',
    })
  ).data as ReverseSwapResponse

  // Show invoice on wallet UI
  onInvoice(createdResponse.invoice)

  const claimInfo: ClaimInfo = {
    createdResponse,
    destinationAddress,
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
  const bip21Data = (await axios.get(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/reverse/${invoice}/bip21`))
    .data
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
