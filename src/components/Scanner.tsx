import { QRCanvas, frameLoop, frontalCamera } from 'qr/dom.js'
import { useRef, useEffect } from 'react'

interface ScannerProps {
  close: () => void
  setData: (arg0: string) => void
  setError: (arg0: string) => void
}

export default function Scanner({ close, setData }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  let camera: any
  let canvas: QRCanvas
  let cancel: () => void

  useEffect(() => {
    const start = async () => {
      if (!videoRef.current) return
      try {
        if (canvas) canvas.clear()
        canvas = new QRCanvas()
        camera = await frontalCamera(videoRef.current)
        const devices = await camera.listDevices()
        await camera.setDevice(devices[devices.length - 1].deviceId)
        cancel = frameLoop(() => {
          const res = camera.readFrame(canvas)
          if (res) {
            setData(res)
            handleClose()
          }
        })
      } catch {}
    }

    start()

    return () => handleClose()
  }, [videoRef])

  const handleClose = () => {
    cancel()
    camera?.stop()
    close()
  }

  return <video className='aspect-4/3 rounded-md mx-auto' ref={videoRef} />
}
