import { ReactNode } from 'react'

interface ColumnsProps {
  children: ReactNode
  cols?: number
}

function Columns({ children, cols }: ColumnsProps) {
  return <div className={`grid grid-cols-${cols ?? 2} gap-y-3 gap-x-3 px-0 mb-10`}>{children}</div>
}

export default Columns
