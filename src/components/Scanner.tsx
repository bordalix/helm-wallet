import { useState } from 'react'
import BarcodeScanner from 'react-qr-barcode-scanner'

interface ScannerProps {
  close: () => void
  setData: (arg0: string) => void
  setError: (arg0: string) => void
}

export default function Scanner({ close, setData, setError }: ScannerProps) {
  const [stopStream, setStopStream] = useState(false)

  const onError = (error: any) => {
    setError(error.message || 'An error occurred while scanning')
    setStopStream(true)
    close()
  }

  const onUpdate = (err: any, result: any) => {
    if (result) {
      setData(result.getText())
      setStopStream(true)
      close()
    }
  }

  return (
    <BarcodeScanner
      delay={300}
      width={500}
      height={500}
      onError={onError}
      onUpdate={onUpdate}
      stopStream={stopStream}
    />
  )
}
