import { useContext, useEffect, useState } from 'react'
import { validateMnemonic } from 'bip39'
import Button from '../../components/Button'
import Title from '../../components/Title'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Columns from '../../components/Columns'
import Word from '../../components/Word'
import Error from '../../components/Error'
import { NavigationContext, Pages } from '../../providers/navigation'
import Content from '../../components/Content'
import { FlowContext } from '../../providers/flow'
import Container from '../../components/Container'

enum ButtonLabel {
  Incomplete = 'Incomplete mnemonic',
  Invalid = 'Invalid mnemonic',
  Ok = 'Continue',
}

export default function InitOld() {
  const { navigate } = useContext(NavigationContext)
  const { setInitInfo } = useContext(FlowContext)

  const [label, setLabel] = useState(ButtonLabel.Incomplete)
  const [passphrase, setPassphrase] = useState(Array.from({ length: 12 }, () => ''))

  useEffect(() => {
    const completed = [...passphrase].filter((a) => a)?.length === 12
    if (!completed) return setLabel(ButtonLabel.Incomplete)
    const valid = validateMnemonic(passphrase.join(' '))
    setLabel(valid ? ButtonLabel.Ok : ButtonLabel.Invalid)
  }, [passphrase])

  const handleChange = (e: any, i: number) => {
    const { value } = e.target
    if (i === 0 && value.split(/\s+/).length === 12) {
      setPassphrase(value.split(/\s+/))
    } else {
      const clone = [...passphrase]
      clone[i] = value
      setPassphrase(clone)
    }
  }

  const handleCancel = () => navigate(Pages.Init)

  const handleProceed = () => {
    const mnemonic = passphrase.join(' ')
    setInitInfo({ mnemonic })
    navigate(Pages.InitPassword)
  }

  const disabled = label !== ButtonLabel.Ok

  return (
    <Container>
      <Content>
        <Title text='Restore wallet' subtext='Insert your secret words' />
        <Error error={label === ButtonLabel.Invalid} text={label} />
        <Columns>
          {[...passphrase].map((word, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Word key={i} left={i + 1} onChange={(e: any) => handleChange(e, i)} text={word} />
          ))}
        </Columns>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleProceed} label={label} disabled={disabled} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
