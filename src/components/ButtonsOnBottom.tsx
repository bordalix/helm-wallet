import { ReactNode } from 'react'

interface ButtonsOnBottomProps {
  children: ReactNode
}

function ButtonsOnBottom({ children }: ButtonsOnBottomProps) {
  return <div className='flex flex-col gap-4 w-80 mx-auto'>{children}</div>
}

export default ButtonsOnBottom
