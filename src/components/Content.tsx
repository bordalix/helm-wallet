import { ReactNode } from 'react'

interface ContentProps {
  children: ReactNode
}

function Content({ children }: ContentProps) {
  return <div className='w-80 mx-auto'>{children}</div>
}

export default Content
