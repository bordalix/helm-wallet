import { ReactNode } from 'react'

interface ColumnsProps {
  children: ReactNode
  cols?: number
}

export default function Columns({ children, cols }: ColumnsProps) {
  return <div className={`grid grid-cols-${cols ?? 2} gap-2 px-0 w-full`}>{children}</div>
}
