import { useContext, useState } from 'react'
import { Wallet, WalletContext } from '../providers/wallet'
import Label from './Label'
import { Transaction } from '../lib/types'
import { prettyAgo, prettyNumber } from '../lib/format'
import ArrowIcon from '../icons/Arrow'
import { NavigationContext, Pages } from '../providers/navigation'
import { openInNewTab } from '../lib/explorers'
import { ClaimInfo, getClaims, removeClaim } from '../lib/claims'
import { waitAndClaim } from '../lib/reverseSwap'
import { ConfigContext } from '../providers/config'

const TransactionLine = ({ data, wallet }: { data: Transaction; wallet: Wallet }) => {
  const amount = `${data.amount > 0 ? '+' : '-'} ${prettyNumber(Math.abs(data.amount))} sats`
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
      <p>{`+ ${prettyNumber(Math.abs(claim.createdResponse.onchainAmount))} sats`}</p>
      <p className='mr-2'>Retry</p>
    </div>
  )
}

export default function TransactionsList({ short }: { short?: boolean }) {
  const { config } = useContext(ConfigContext)
  const { navigate } = useContext(NavigationContext)
  const { chainSource, reloading, reloadWallet, wallet } = useContext(WalletContext)

  const [claiming, setClaiming] = useState(false)

  const claims = getClaims(wallet.network)
  const transactions = wallet.transactions[wallet.network]

  if (transactions?.length + claims.length === 0) return <></>

  const showMax = 3
  const txSorted = transactions.sort((a, b) => (!a.unixdate ? -1 : !b.unixdate ? 1 : b.unixdate - a.unixdate))
  const lines = [...claims, ...txSorted]
  const showLines = short ? lines.slice(0, showMax) : lines

  const handleReload = () => reloadWallet(wallet)
  const handleFinishClaim = () => {
    setClaiming(false)
    reloadWallet(wallet)
  }

  const claimPendingSwaps = async () => {
    const claims = getClaims(wallet.network)
    if (claims.length > 0) {
      setClaiming(true)
      const tip = await chainSource.fetchChainTip()
      for (const claim of claims) {
        const expired = claim.createdResponse.timeoutBlockHeight <= tip
        if (expired) removeClaim(claim, wallet.network)
        else waitAndClaim(claim, config, wallet, handleFinishClaim)
      }
    }
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
            <PendingClaim key={l.createdResponse.id} claim={l} onClick={claimPendingSwaps} />
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
