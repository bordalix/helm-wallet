import { ReactNode } from 'react'

interface ContentProps {
  children: ReactNode
}

export default function Content({ children }: ContentProps) {
  return <div className='w-80 mx-auto'>{children}</div>
}
