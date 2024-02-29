import { ReactNode, useContext } from 'react'
import { formatInvoice } from '../lib/format'
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

  const boltzFees = 148 // TODO

  return (
    <div className='my-10'>
      <Item title='Satoshis' body={sendInfo.satoshis} />
      <Item title='Note' body={sendInfo.note} />
      <Item title='Invoice' body={formatInvoice(sendInfo.invoice)} />
      <Item title='Boltz fees' body={`${boltzFees} sats`} />
      <Item title='Total' body={`${boltzFees + sendInfo.satoshis} sats`} />
    </div>
  )
}

export default InvoiceDetails
