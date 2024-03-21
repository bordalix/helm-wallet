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

export const finalizeSubmarineSwap = (sendInfo: SendInfo, wallet: Wallet, onTxid: (txid: string) => void) => {
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
        sendSats(swapResponse.expectedAmount, swapResponse.address, swapResponse.blindingKey, wallet)
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
