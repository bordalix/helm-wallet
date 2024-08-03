import { useEffect, useState } from 'react'
import Label from './Label'

interface InputCommentProps {
  max: number
  onChange: (arg0: any) => void
  subtext?: boolean
}

export default function InputComment({ max, onChange, subtext }: InputCommentProps) {
  const [comment, setComment] = useState('')

  useEffect(() => {
    onChange(comment)
  }, [comment])

  return (
    <fieldset className='text-left text-gray-800 dark:text-gray-100 w-full mb-4'>
      <div className='flex justify-between items-center'>
        <Label text='Comment' />
        <p className='text-xs'>Optional</p>
      </div>
      <div className='flex items-center h-12 bg-gray-100 dark:bg-gray-800 rounded-md text-sm'>
        <input
          className='w-full p-3 font-semibold bg-gray-100 dark:bg-gray-800 focus-visible:outline-none rounded-md'
          maxLength={max}
          onChange={(e) => setComment(e.target.value)}
          type='text'
          value={comment}
        />
      </div>
      <div className='flex justify-between items-center text-xs mt-1'>
        <p>Max chars: {max}</p>
        {subtext ? <p className='text-center text-xs my-1'>Will be visible on invoice</p> : null}
      </div>
    </fieldset>
  )
}
