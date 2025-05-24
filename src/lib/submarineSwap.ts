import zkpInit from '@vulpemventures/secp256k1-zkp'
import axios from 'axios'
import { crypto } from 'bitcoinjs-lib'
import { Musig, SwapTreeSerializer } from 'boltz-core'
import { randomBytes } from 'crypto'
import { Wallet } from '../providers/wallet'
import { TaprootUtils } from 'boltz-core/dist/lib/liquid'
import bolt11 from 'bolt11'
import { SendInfo } from '../providers/flow'
import { getBoltzApiUrl, getBoltzWsUrl } from './boltz'
import { sendSats } from './transactions'
import { NetworkName } from './network'
import { Config } from '../providers/config'
import { hex } from '@scure/base'
import { logFail, logRunning, logStart, logSuccess } from './logs'

/**
 * Submarine swap flow:
 * 1. user sends invoice to be paid to boltz
 * 2. user generates and sends refund public key to boltz
 * 3. user receives liquid address where to send funds
 * 4. user validates lightining invoice
 *
 * When a Normal Submarine Swap is created, it passes through the following states:
 *
 * 1. swap.created: initial state of the swap; optionally the initial state can also be invoice.set in case the invoice
 *    was already specified in the /createswap request. Boltz Web App is an example for a client that sets the invoice
 *    with /createswap already.
 *
 * 2. transaction.mempool: a transaction that sends bitcoin to the chain address is found in the mempool, meaning user
 *    sent funds to the lockup chain address.
 *
 * 3. transaction.confirmed: the lockup transaction was included in a block. For mainchain swaps, Boltz always waits
 *    for one confirmation before continuing with the swap. The getpairs call provides amount limits for which Boltz
 *    accepts 0-conf per pair.
 *
 * 4. invoice.set: if the invoice was not set as part of the /createswap request, this state confirms that an invoice
 *    with the correct amount and hash was set.
 *
 * 5. Once the user's lockup transaction is included in a block (or found in the mempool if 0-conf applies), Boltz will
 *    try to pay the invoice provided by the user. When successful, Boltz obtains the preimage needed to claim the
 *    chain bitcoin. State of the Lightning payment is either:
 *      - invoice.pending: if paying the invoice is in progress
 *      - invoice.paid: if paying the invoice was successful or
 *      - invoice.failedToPay: if paying the invoice failed. In this case the user needs to broadcast a refund
 *        transaction to reclaim the locked up chain bitcoin.
 *
 * 6. transaction.claim.pending: This status indicates that Boltz is ready for the creation of a cooperative signature
 *    for a key path spend. Taproot Swaps are not claimed immediately by Boltz after the invoice has been paid, but
 *    instead Boltz waits for the API client to post a signature for a key path spend. If the API client does not
 *    cooperate in a key path spend, Boltz will eventually claim via the script path.
 *
 * 7. transaction.claimed: indicates that after the invoice was successfully paid, the chain bitcoin were successfully
 *    claimed by Boltz. This is the final status of a successful Normal Submarine Swap.
 */

interface SubmarineSwapClaimResponse {
  preimage: string
  pubNonce: string
  publicKey: string
  transactionHash: string
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
  refundPublicKey: string,
  network: NetworkName,
  config: Config,
): Promise<SubmarineSwapResponse> => {
  // Create a Submarine Swap
  const swapResponse: SubmarineSwapResponse = (
    await axios.post(`${getBoltzApiUrl(network, config.tor)}/v2/swap/submarine`, {
      invoice,
      to: 'BTC',
      from: 'L-BTC',
      referralId: 'helm',
      refundPublicKey,
    })
  ).data

  logStart(`Submarine swap ${swapResponse.id}`, { swapResponse })
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
  let txid = ''

  // Create a WebSocket and subscribe to updates for the created swap
  const webSocket = new WebSocket(getBoltzWsUrl(wallet.network, config.tor))
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
    const msg = JSON.parse(rawMsg.data)
    if (msg.event !== 'update') {
      return
    }

    switch (msg.args[0].status) {
      // "invoice.set" means Boltz is waiting for an onchain transaction to be sent
      case 'invoice.set': {
        logRunning('Waiting for onchain transaction')
        txid = await sendSats(swapResponse.expectedAmount, swapResponse.address, wallet, config)
        break
      }

      // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
      case 'transaction.claim.pending': {
        logRunning('Creating claim transaction')

        // Get the information request to create a partial signature
        const url = `${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/submarine/${swapResponse.id}/claim`
        const claimTxDetails: SubmarineSwapClaimResponse = (await axios.get(url)).data

        // Verify that Boltz actually paid the invoice by comparing the preimage hash
        // of the invoice to the SHA256 hash of the preimage from the response
        const invoicePreimageHash = Buffer.from(
          bolt11.decode(invoice).tags.find((tag) => tag.tagName === 'payment_hash')!.data as string,
          'hex',
        )
        if (!crypto.sha256(Buffer.from(claimTxDetails.preimage, 'hex')).equals(invoicePreimageHash)) {
          logFail('Boltz provided invalid preimage', claimTxDetails)
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
        await axios.post(`${getBoltzApiUrl(wallet.network, config.tor)}/v2/swap/submarine/${swapResponse.id}/claim`, {
          pubNonce: hex.encode(Uint8Array.from(musig.getPublicNonce())),
          partialSignature: hex.encode(Uint8Array.from(musig.signPartial())),
        })

        logRunning('Partial sig sent to Boltz')

        break
      }

      case 'transaction.claimed':
        logSuccess('Submarine swap successful', { txid })
        webSocket.close()
        onTxid(txid)
        break
    }
  }
}
