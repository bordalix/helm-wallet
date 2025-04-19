import { formatInvoice } from '../lib/format'
import encodeQR from 'qr'

interface QrCodeProps {
  value: string
}

export default function QrCode({ value }: QrCodeProps) {
  // encode value to a gif
  const qrGifDataUrl = (text: string) => {
    const gifBytes = encodeQR(text, 'gif', { scale: 7 })
    const blob = new Blob([gifBytes], { type: 'image/gif' })
    return URL.createObjectURL(blob)
  }

  return (
    <div className='w-[420px] max-w-full mx-auto select-none'>
      {value ? (
        <div className='bg-white p-[10px] rounded-md'>
          <img alt='QR Code' className='w-full' src={qrGifDataUrl(value)} />
        </div>
      ) : null}
      <p className='mt-4'>{formatInvoice(value)}</p>
    </div>
  )
}
