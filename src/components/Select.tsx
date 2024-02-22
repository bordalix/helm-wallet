function Select({ children, onChange, value }: any) {
  const className =
    'bg-gray-50 border border-gray-300 mt-10 text-gray-900 text-lg rounded-lg w-80 focus:ring-blue-500 focus:border-blue-500 p-2.5'

  return (
    <select className={className} onChange={onChange} value={value}>
      {children}
    </select>
  )
}

export default Select
