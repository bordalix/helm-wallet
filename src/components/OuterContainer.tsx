import { ReactNode } from 'react'

interface OuterContainerProps {
  children: ReactNode
}

export default function OuterContainer({ children }: OuterContainerProps) {
  return <div className='container h-full py-4 flex flex-col'>{children}</div>
}
