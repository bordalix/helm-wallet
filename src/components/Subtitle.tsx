interface SubtitleProps {
  text: string
}

function Subtitle({ text }: SubtitleProps) {
  return <h2 className='mt-2 mb-10'>{text}</h2>
}

export default Subtitle
