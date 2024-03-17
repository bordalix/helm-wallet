import { useContext } from 'react'
import { WalletContext } from '../providers/wallet'
import Label from './Label'
import { Transaction } from '../lib/types'
import { prettyAgo, prettyNumber } from '../lib/format'
import ArrowIcon from '../icons/Arrow'
import { NavigationContext, Pages } from '../providers/navigation'

const TransactionLine = ({ data }: { data: Transaction }) => {
  const amount = `${data.amount > 0 ? '+' : '-'} ${prettyNumber(data.amount)} sats`
  const date = data.date ? `${prettyAgo(data.date)} ago` : 'just now'
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
  const sorted = transactions.sort((a, b) => (!a.date ? -1 : !b.date ? 1 : b.date - a.date))
  const showTxs = short ? sorted.slice(0, showMax) : sorted

  return (
    <div className='flex flex-col gap-2 h-96 overflow-auto'>
      <Label text={`${short ? 'Last' : 'All'} transactions`} />
      {showTxs.map((t) => (
        <TransactionLine key={t.txid} data={t} />
      ))}
      {short && transactions.length > showMax ? (
        <div className='border bg-gray-100 p-2 flex justify-end w-full rounded-md'>
          <div className='flex' onClick={() => navigate(Pages.Transactions)}>
            <p className='mr-2 cursor-pointer'>All transactions</p>
            <ArrowIcon tiny />
          </div>
        </div>
      ) : null}
    </div>
  )
}
