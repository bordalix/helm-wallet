import { useContext, useState } from 'react'
import QRCode from 'react-qr-code'
import { formatInvoice } from '../../../lib/format'
import Button from '../../../components/Button'
import ButtonsOnBottom from '../../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../../providers/navigation'
import Content from '../../../components/Content'
import Subtitle from '../../../components/Subtitle'
import Title from '../../../components/Title'

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
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Invoice' />
        <Subtitle text='payment details' />
        <div className='mx-auto mt-8'>
          <QRCode size={320} value={invoice} />
          <p className='mt-4'>{formatInvoice(invoice)}</p>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleCopy} label={buttonLabel} secondary />
        <Button onClick={handleSuccess} label='Success' />
      </ButtonsOnBottom>
    </div>
  )
}

export default ReceiveInvoice
