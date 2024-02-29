import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
}

function Container({ children }: ContainerProps) {
  return <div className='flex flex-col h-full justify-between'>{children}</div>
}

export default Container
