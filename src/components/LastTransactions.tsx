import { useContext } from 'react'
import { WalletContext } from '../providers/wallet'
import Label from './Label'
import { Transaction } from '../lib/types'
import { prettyAgo, prettyNumber } from '../lib/format'
import ArrowIcon from '../icons/Arrow'

const SummaryTransaction = ({ data }: { data: Transaction }) => {
  const amount = `${data.amount > 0 ? '+' : '-'} ${prettyNumber(data.amount)} sats`
  const date = `${prettyAgo(data.date)} ago`
  return (
    <div className='bg-gray-100 p-2 flex justify-between w-full rounded-md'>
      <p>{amount}</p>
      <div className='flex'>
        <p className='mr-2'>{date}</p>
        <ArrowIcon tiny />
      </div>
    </div>
  )
}

function LastTransactions() {
  const { wallet } = useContext(WalletContext)

  const { transactions } = wallet

  if (transactions?.length === 0) return <></>

  const showMax = 3
  const topTxs = transactions.slice(0, showMax)

  return (
    <div className='mt-10 flex flex-col gap-2'>
      <Label text='Last transactions' />
      {topTxs.map((t) => (
        <SummaryTransaction key={t.txid} data={t} />
      ))}
      {transactions.length > showMax ? (
        <div className='border p-2 flex justify-end w-full rounded-md'>
          <div className='flex'>
            <p className='mr-2'>All transactions</p>
            <ArrowIcon tiny />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LastTransactions
