import LoadingIcon from '../icons/Loading'
import CenterScreen from './CenterScreen'

interface RestoringProps {
  restoring: number
}

export default function Restoring({ restoring }: RestoringProps) {
  return (
    <CenterScreen>
      <LoadingIcon />
      <div>
        <p>Restoring wallet</p>
        <p>{restoring > 0 ? `${restoring} transaction${restoring > 1 ? 's' : ''} to go` : 'Please wait'}</p>
      </div>
    </CenterScreen>
  )
}
