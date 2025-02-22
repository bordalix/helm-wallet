import { QRCanvas, frameLoop, frontalCamera } from '@paulmillr/qr/dom.js'
import { useRef, useEffect } from 'react'

interface ScannerProps {
  close: () => void
  setData: (arg0: string) => void
  setError: (arg0: string) => void
}

export default function Scanner({ close, setData }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  let camera: any

  useEffect(() => {
    let cancel: () => void
    const start = async () => {
      if (!videoRef.current) return
      try {
        const canvas = new QRCanvas()
        camera = await frontalCamera(videoRef.current)
        const devices = await camera.listDevices()
        await camera.setDevice(devices[devices.length - 1].deviceId)
        cancel = frameLoop(() => {
          const res = camera.readFrame(canvas)
          if (res) {
            cancel()
            setData(res)
            handleClose()
          }
        })
      } catch {}
    }

    start()

    return () => {
      cancel(), handleClose()
    }
  }, [videoRef])

  const handleClose = () => {
    console.log('handleClose', camera)
    camera?.stop()
    close()
  }

  return <video className='rounded-md mx-auto' ref={videoRef} />
}
