import { formatInvoice } from '../lib/format'
import QRCode from 'react-qr-code'

interface QrCodeProps {
  value: string
}

export default function QrCode({ value }: QrCodeProps) {
  return (
    <div className='w-[300px] mx-auto'>
      {value ? (
        <div className='bg-white p-[10px]'>
          <QRCode size={280} value={value} fgColor='#000000' />
        </div>
      ) : null}
      <p className='mt-4'>{formatInvoice(value)}</p>
    </div>
  )
}
