import { formatInvoice } from '../lib/format'
import QRCode from 'react-qr-code'

interface QrCodeProps {
  value: string
}

export default function QrCode({ value }: QrCodeProps) {
  return (
    <div className='w-[280px] mx-auto'>
      <QRCode size={280} value={value} fgColor={value ? '#000000' : '#ffffff'} />
      <p className='mt-4'>{formatInvoice(value)}</p>
    </div>
  )
}
