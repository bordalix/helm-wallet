interface TableProps {
  data: string[][]
}

function Table({ data }: TableProps) {
  return (
    <table className='w-full table-fixed'>
      <tbody>
        {data.map((row, idx) => (
          <tr key={row[0]} className={idx + 1 === data.length ? 'border-t' : ''}>
            <td className='py-3 text-left font-semibold'>{row[0]}</td>
            <td className='py-3 text-right'>{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Table
