import LoadingIcon from '../icons/Loading'
import CenterScreen from './CenterScreen'

export default function Loading({ text }: { text?: string }) {
  return (
    <CenterScreen>
      <LoadingIcon />
      {text ? <p className='max-w-52'>{text}</p> : null}
    </CenterScreen>
  )
}
