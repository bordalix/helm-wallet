interface TitleProps {
  subtext?: string
  text: string
}

export default function Title({ subtext, text }: TitleProps) {
  return (
    <div className='min-h-24'>
      <h1 className='text-3xl font-bold'>{text}</h1>
      {subtext ? <h2 className='mt-2'>{subtext}</h2> : null}
    </div>
  )
}
