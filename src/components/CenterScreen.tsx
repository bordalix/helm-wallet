interface CenterScreenProps {
  children: React.ReactNode
  onClick?: () => void
}

export default function CenterScreen({ children, onClick }: CenterScreenProps) {
  return (
    <div className='flex h-40 text-center' onClick={onClick}>
      <div className='m-auto'>{children}</div>
    </div>
  )
}
