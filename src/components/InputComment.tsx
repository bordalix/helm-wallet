import Label from './Label'

interface InputCommentProps {
  max: number
  comment: string
  setComment: (arg0: any) => void
  subtext?: boolean
}

export default function InputComment({ max, comment, setComment, subtext }: InputCommentProps) {
  const maxChars = `${comment.length}/${max}`

  return (
    <fieldset className='text-left text-gray-800 dark:text-gray-100 w-full mb-4'>
      <div className='flex justify-between items-center'>
        <Label text='Comment' />
        <p className='text-xs'>Optional</p>
      </div>
      <div className='flex items-center h-12 bg-gray-100 dark:bg-gray-900 rounded-md text-sm'>
        <input
          className='w-full p-3 font-semibold bg-gray-100 dark:bg-gray-900 focus-visible:outline-none rounded-md'
          maxLength={max}
          onChange={(e) => setComment(e.target.value)}
          type='text'
          value={comment}
        />
      </div>
      <div className='flex justify-between items-center text-xs mt-1'>
        <p>Max chars: {maxChars}</p>
        {subtext ? <p className='text-center text-xs my-1'>Will be visible on invoice</p> : null}
      </div>
    </fieldset>
  )
}
