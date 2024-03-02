import { useContext, useState } from 'react'
import Button from '../../../components/Button'
import Content from '../../../components/Content'
import Title from '../../../components/Title'
import QrCode from '../../../components/QrCode'
import Container from '../../../components/Container'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { FlowContext, emptyRecvInfo } from '../../../providers/flow'
import { NavigationContext, Pages } from '../../../providers/navigation'

function ReceiveInvoice() {
  const { navigate } = useContext(NavigationContext)
  const { setRecvInfo } = useContext(FlowContext)

  const label = 'Copy to clipboard'
  const [buttonLabel, setButtonLabel] = useState(label)

  const handleCancel = () => {
    setRecvInfo(emptyRecvInfo)
    navigate(Pages.Wallet)
  }

  // TODO remove this
  const invoice =
    'lnbc100u1pj6xzwhsp52zxjtjhf78et4cm32vn8wffwjhkgy3xfg832dujvzg0jz7la0sxspp5huztuslwlenr039vvuyy8897625xz83he5q60szn3076gedqtwasdpz2djkuepqw3hjqnpdgf2yxgrpv3j8yetnwvxqyp2xqcqz959qxpqysgq3jlzcq7u8k9ym86pa6tuxvsn4mk0fye8vpmawgv25a3mkn0dh3yhamrrrk8nm32wx6akgww2dulj4crpug6qn38th6u5pck029txlaspge89je'

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(() => {
      setButtonLabel('Copied')
      setTimeout(() => setButtonLabel(label), 2000)
    })
  }

  return (
    <Container>
      <Content>
        <Title text='Invoice' subtext='Scan or copy to clipboard' />
        <QrCode invoice={invoice} />
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCopy} label={buttonLabel} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}

export default ReceiveInvoice
