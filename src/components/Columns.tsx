function Columns({ children, cols }: any) {
  return <div className={`grid grid-cols-${cols ?? 2} gap-y-3 gap-x-3 px-0`}>{children}</div>
}

export default Columns
