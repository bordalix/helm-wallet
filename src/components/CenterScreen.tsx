export default function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-40 text-center'>
      <div className='m-auto'>{children}</div>
    </div>
  )
}
