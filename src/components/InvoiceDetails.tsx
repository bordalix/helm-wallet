import { useContext } from 'react'
import { formatInvoice, prettyNumber } from '../lib/format'
import { FlowContext } from '../providers/flow'

const Item = ({ title, body }: any) => {
  return (
    <div className='mb-8'>
      <p className='font-bold'>{title}</p>
      <p className=''>{body}</p>
    </div>
  )
}

function InvoiceDetails() {
  const { sendInfo } = useContext(FlowContext)

  return (
    <div className='mb-10'>
      <Item title='Amount' body={`${prettyNumber(sendInfo.satoshis)} sats`} />
      <Item title='Note' body={sendInfo.note} />
      <Item title='Invoice' body={formatInvoice(sendInfo.invoice)} />
    </div>
  )
}

export default InvoiceDetails
