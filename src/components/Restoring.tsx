import Loading from './Loading'

interface RestoringProps {
  restoring: number
}

export default function Restoring({ restoring }: RestoringProps) {
  return (
    <>
      <Loading text='Restoring wallet' />
      <p>{restoring > 0 ? `${restoring} transaction${restoring > 1 ? 's' : ''} to go` : 'Please wait'}</p>
    </>
  )
}
