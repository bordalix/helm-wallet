import TipIcon from '../icons/Tip'

interface TipProps {
  text: string
}

export default function Tip({ text }: TipProps) {
  return (
    <div className='mt-10 flex flex-col gap-1 items-center text-sm'>
      <p className='font-semibold'>Tip:</p>
      <p>{text}</p>
    </div>
  )
}
