import Columns from './Columns'

interface KeyboardProps {
  onClick: (arg0: any) => void
}

export default function Keyboard({ onClick }: KeyboardProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<']

  return (
    <Columns cols={3}>
      {keys.map((k) => (
        <p
          key={k}
          className='text-center p-3 sm:p-5 bg-gray-100 dark:bg-gray-900 rounded-md select-none'
          onClick={() => onClick(k)}
        >
          {k}
        </p>
      ))}
    </Columns>
  )
}
