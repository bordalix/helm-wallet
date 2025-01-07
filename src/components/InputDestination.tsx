import { useEffect, useState } from 'react'
import Label from './Label'
import { InputWithAction } from './Input'
import BarcodeScanner from './BarcodeScanner'

interface InputDestinationProps {
  onChange: (arg0: string) => void
  onError: (arg0: string) => void
  onScan: (arg0: string) => void
}

export default function InputDestination({ onChange, onError, onScan }: InputDestinationProps) {
  const [mediaStream, setMediaStream] = useState(false)
  const [scan, setScan] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => onChange(text), [text])

  const getUserMedia = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setMediaStream(true)
          stream.getVideoTracks().forEach((track) => track.stop())
        })
        .catch((error) => console.error('Permission denied: ', error))
    } else {
      console.error('getUserMedia is not supported in this browser.')
    }
  }

  const handleClick = () => {
    if (scan) return setScan(false)
    getUserMedia()
    setScan(true)
  }

  const handleChange = (ev: any) => setText(ev.target.value)

  return (
    <div className='flex flex-col h-full justify-between gap-2'>
      <fieldset className='text-left text-gray-800 dark:text-gray-100 w-full'>
        <Label text='Destination' />
        <InputWithAction onChange={handleChange} onClick={handleClick} pill='Scan' text={text} />
      </fieldset>
      {scan && mediaStream ? <BarcodeScanner setPastedData={onScan} setError={onError} /> : null}
      {scan && !mediaStream ? <p className='mt-4'>Waiting for camera access</p> : null}
    </div>
  )
}
