import { formatInvoice, prettyNumber } from '../lib/format'
import { Unit, unitLabels } from '../lib/units'

export const Item = ({ title, body }: { title: string; body: string }) => {
  return (
    <div className='mb-8'>
      <p className='font-bold'>{title}</p>
      <p className=''>{body}</p>
    </div>
  )
}

export interface PaymentDetailsProps {
  address?: string
  invoice?: string
  note?: string
  satoshis: number
}

export default function PaymentDetails({ details }: { details?: PaymentDetailsProps }) {
  if (!details) return <></>
  const { address, invoice, note, satoshis } = details
  return (
    <div>
      <Item title='Amount' body={`${prettyNumber(satoshis)} ${unitLabels[Unit.SAT]}`} />
      {note ? <Item title='Note' body={note} /> : null}
      {invoice ? <Item title='Invoice' body={formatInvoice(invoice)} /> : null}
      {address ? <Item title='Address' body={formatInvoice(address)} /> : null}
    </div>
  )
}
