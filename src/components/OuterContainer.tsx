import { ReactNode } from 'react'

interface OuterContainerProps {
  children: ReactNode
}

export default function OuterContainer({ children }: OuterContainerProps) {
  return <div className='max-w-96 mx-auto h-full p-4 pb-2 flex flex-col'>{children}</div>
}
