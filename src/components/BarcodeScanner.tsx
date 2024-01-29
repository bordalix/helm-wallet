import { useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

function BarcodeScanner({ setData, setError }: any) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reader = useRef(new BrowserMultiFormatReader())

  useEffect(() => {
    const readerCurrent = reader.current
    reader.current.listVideoInputDevices().then((list) => {
      if (!videoRef.current || list.length === 0) {
        setError('Qr code reader unavailable')
        return
      }
      readerCurrent.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: 'environment',
          },
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            const aux = JSON.stringify(result)
            setData(JSON.parse(aux).text)
          }
          if (error) console.error(error)
        },
      )
    })

    return () => {
      readerCurrent.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef])

  return <video className='mx-auto mb-2' ref={videoRef} />
}

export default BarcodeScanner
