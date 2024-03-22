import { useContext } from 'react'
import { WalletContext } from '../providers/wallet'
import Label from './Label'
import { Transaction } from '../lib/types'
import { prettyAgo, prettyNumber } from '../lib/format'
import ArrowIcon from '../icons/Arrow'
import { NavigationContext, Pages } from '../providers/navigation'

const TransactionLine = ({ data }: { data: Transaction }) => {
  const amount = `${data.amount > 0 ? '+' : '-'} ${prettyNumber(Math.abs(data.amount))} sats`
  const date = data.unixdate ? `${prettyAgo(data.unixdate)} ago` : 'just now'
  return (
    <div className='border p-2 flex justify-between w-full rounded-md'>
      <p>{amount}</p>
      <p className='mr-2'>{date}</p>
    </div>
  )
}

export default function TransactionsList({ short }: { short?: boolean }) {
  const { navigate } = useContext(NavigationContext)
  const { wallet } = useContext(WalletContext)

  const transactions = wallet.transactions[wallet.network]

  if (transactions?.length === 0) return <></>

  const showMax = 3
  const sorted = transactions.sort((a, b) => (!a.unixdate ? -1 : !b.unixdate ? 1 : b.unixdate - a.unixdate))
  const showTxs = short ? sorted.slice(0, showMax) : sorted

  return (
    <div className='mt-4'>
      <Label text={`${short ? 'Last' : 'All'} transactions`} />
      <div className='flex flex-col gap-2 h-72 overflow-auto'>
        {showTxs.map((t) => (
          <TransactionLine key={`${t.amount} ${t.txid}`} data={t} />
        ))}
        {short && transactions.length > showMax ? (
          <div
            className='border bg-gray-100 cursor-pointer p-2 flex justify-end w-full rounded-md'
            onClick={() => navigate(Pages.Transactions)}
          >
            <div className='flex'>
              <p className='mr-2'>All transactions</p>
              <ArrowIcon tiny />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
