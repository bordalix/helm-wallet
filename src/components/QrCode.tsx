import { formatInvoice } from '../lib/format'
import QRCode from 'react-qr-code'

interface QrCodeProps {
  invoice: string
}

export default function QrCode({ invoice }: QrCodeProps) {
  return (
    <div className='mx-auto'>
      <QRCode size={320} value={invoice} fgColor={invoice ? '#000000' : '#ffffff'} />
      <p className='mt-4'>{formatInvoice(invoice)}</p>
    </div>
  )
}
