import { formatInvoice, prettyNumber } from '../lib/format'
import { decodeInvoice } from '../lib/lightning'

export const Item = ({ title, body }: { title: string; body: string }) => {
  return (
    <div className='mb-8'>
      <p className='font-bold'>{title}</p>
      <p className=''>{body}</p>
    </div>
  )
}

interface InvoiceDetailsProps {
  invoice: string
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const { note, satoshis } = decodeInvoice(invoice)

  return (
    <div>
      <Item title='Amount' body={`${prettyNumber(satoshis)} sats`} />
      <Item title='Note' body={note} />
      <Item title='Invoice' body={formatInvoice(invoice)} />
    </div>
  )
}
