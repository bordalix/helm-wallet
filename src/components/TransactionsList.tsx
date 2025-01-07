import { useContext, useState } from 'react'
import { Wallet, WalletContext } from '../providers/wallet'
import Label from './Label'
import { Transaction } from '../lib/types'
import { prettyAgo, prettyNumber } from '../lib/format'
import ArrowIcon from '../icons/Arrow'
import { NavigationContext, Pages } from '../providers/navigation'
import { broadcastTxHex, openInNewTab } from '../lib/explorers'
import { ClaimInfo, getRetriableClaims, removeClaim } from '../lib/claims'
import { waitAndClaim } from '../lib/reverseSwap'
import { ConfigContext } from '../providers/config'
import { FlowContext } from '../providers/flow'
import { unitLabels, Unit } from '../lib/units'

const TransactionLine = ({ data, wallet }: { data: Transaction; wallet: Wallet }) => {
  const amount = `${data.amount > 0 ? '+' : '-'} ${prettyNumber(Math.abs(data.amount))} ${unitLabels[Unit.SAT]}`
  const date = data.unixdate ? prettyAgo(data.unixdate) : 'just now'
  const divClass = 'border cursor-pointer p-2 flex justify-between w-full rounded-md'
  return (
    <div className={divClass} onClick={() => openInNewTab(data.txid, wallet)}>
      <p>{amount}</p>
      <p className='mr-2'>{date}</p>
    </div>
  )
}

const PendingClaim = ({ claim, onClick }: { claim: ClaimInfo; onClick: any }) => {
  const divClass = 'border border-red-500 bg-red-500/50 cursor-pointer p-2 flex justify-between w-full rounded-md'
  return (
    <div className={divClass} onClick={onClick}>
      <p>{`+ ${prettyNumber(Math.abs(claim.createdResponse.onchainAmount))} ${unitLabels[Unit.SAT]}`}</p>
      <p className='mr-2'>Retry</p>
    </div>
  )
}

export default function TransactionsList({ short }: { short?: boolean }) {
  const { config } = useContext(ConfigContext)
  const { setRecvInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { reloading, reloadWallet, wallet } = useContext(WalletContext)

  const [claiming, setClaiming] = useState(false)

  const claims = getRetriableClaims(wallet.network)
  const transactions = wallet.transactions[wallet.network]

  if (transactions?.length + claims.length === 0) return <></>

  const showMax = 3
  const txSorted = transactions.sort((a, b) => (!a.unixdate ? -1 : !b.unixdate ? 1 : b.unixdate - a.unixdate))
  const lines = [...claims, ...txSorted]
  const showLines = short ? lines.slice(0, showMax) : lines

  const handleReload = () => reloadWallet(wallet)

  const claimPendingSwap = (claim: ClaimInfo) => {
    setClaiming(true)

    const handleFinish = (txid: string) => {
      if (!txid) return setClaiming(false)
      removeClaim(claim, wallet.network)
      reloadWallet(wallet)
      setRecvInfo({
        amount: claim.createdResponse.onchainAmount,
        comment: '',
        total: claim.createdResponse.onchainAmount,
        txid,
      })
      navigate(Pages.ReceiveSuccess)
    }

    if (claim.claimTx) broadcastTxHex(claim.claimTx, wallet, config).then(({ id }) => handleFinish(id))
    else waitAndClaim(claim, config, wallet, handleFinish)
  }

  return (
    <div className='mt-4'>
      <div className='flex justify-between'>
        <Label text={`${short ? 'Last' : 'All'} transactions`} />
        {reloading ? (
          <Label text='Reloading...' pulse />
        ) : claiming ? (
          <Label text='Claiming...' pulse />
        ) : (
          <Label onClick={handleReload} pointer text={`Updated ${prettyAgo(wallet.lastUpdate)}`} />
        )}
      </div>
      <div className='flex flex-col gap-2 h-72 overflow-auto'>
        {showLines.map((l: any) =>
          l.txid ? (
            <TransactionLine key={`${l.amount} ${l.txid}`} data={l} wallet={wallet} />
          ) : (
            <PendingClaim key={l.createdResponse.id} claim={l} onClick={() => claimPendingSwap(l)} />
          ),
        )}
        {short && transactions.length > showMax ? (
          <div className='border bg-gray-100 dark:bg-gray-800 p-2 flex justify-end w-full rounded-md'>
            <div className='flex cursor-pointer' onClick={() => navigate(Pages.Transactions)}>
              <p className='mr-2'>View all {transactions.length} transactions</p>
              <ArrowIcon tiny />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
