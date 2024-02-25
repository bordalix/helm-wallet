interface TitleProps {
  text: string
}

function Title({ text }: TitleProps) {
  return <h1 className='text-3xl font-bold'>{text}</h1>
}

export default Title
