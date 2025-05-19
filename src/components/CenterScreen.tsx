interface CenterScreenProps {
  children: React.ReactNode
  onClick?: () => void
}

export default function CenterScreen({ children, onClick }: CenterScreenProps) {
  return (
    <div className='flex flex-col justify-center items-center h-40 gap-4' onClick={onClick}>
      {children}
    </div>
  )
}
