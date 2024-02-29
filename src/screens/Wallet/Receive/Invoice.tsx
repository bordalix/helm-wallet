import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Subtitle from '../../../components/Subtitle'
import Title from '../../../components/Title'
import QrCode from '../../../components/QrCode'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'

function ReceiveInvoice() {
  const { navigate } = useContext(NavigationContext)

  const defaultLabel = 'Copy to clipboard'
  const [buttonLabel, setButtonLabel] = useState(defaultLabel)

  // TODO remove this
  const invoice =
    'lnbc100u1pj6xzwhsp52zxjtjhf78et4cm32vn8wffwjhkgy3xfg832dujvzg0jz7la0sxspp5huztuslwlenr039vvuyy8897625xz83he5q60szn3076gedqtwasdpz2djkuepqw3hjqnpdgf2yxgrpv3j8yetnwvxqyp2xqcqz959qxpqysgq3jlzcq7u8k9ym86pa6tuxvsn4mk0fye8vpmawgv25a3mkn0dh3yhamrrrk8nm32wx6akgww2dulj4crpug6qn38th6u5pck029txlaspge89je'

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(() => {
      setButtonLabel('Copied')
      setTimeout(() => setButtonLabel(defaultLabel), 2000)
    })
  }

  const handleSuccess = () => {
    navigate(Pages.ReceiveSuccess)
  }

  return (
    <Container>
      <Content>
        <Title text='Invoice' />
        <QrCode invoice={invoice} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCopy} label={buttonLabel} />
        <Button onClick={handleSuccess} label='Success' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default ReceiveInvoice
