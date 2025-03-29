import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import NewPassword from '../../components/NewPassword'
import NeedsPassword from '../../components/NeedsPassword'
import Container from '../../components/Container'
import { saveMnemonicToStorage } from '../../lib/storage'
import { WalletContext } from '../../providers/wallet'
import { isBiometricsSupported, registerUser } from '../../lib/biometrics'
import Error from '../../components/Error'
import FingerprintIcon from '../../icons/Fingerprint'

export default function Password() {
  const { toggleShowConfig } = useContext(ConfigContext)
  const { updateWallet, wallet } = useContext(WalletContext)

  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')

  const proceed = (pass = password, passkeyId = '') => {
    saveMnemonicToStorage(mnemonic, pass)
    updateWallet({ ...wallet, lockedByBiometrics: passkeyId.length > 0, passkeyId })
    toggleShowConfig()
  }

  const handleBiometrics = () => {
    setError('')
    registerUser()
      .then(({ password, passkeyId }) => proceed(password, passkeyId))
      .catch(() => setError('Biometrics registration failed'))
  }

  const handleClick = () => proceed(password)

  return (
    <Container>
      <Content>
        <Title text='Password' subtext='Change your password' />
        <Error error={Boolean(error)} text={error} />
        {mnemonic ? <NewPassword onNewPassword={setPassword} setLabel={setLabel} /> : null}
      </Content>
      <ButtonsOnBottom>
        {isBiometricsSupported() ? (
          <Button icon={<FingerprintIcon small />} onClick={handleBiometrics} label='Use biometrics' clean />
        ) : null}
        <Button onClick={handleClick} label={label} disabled={!password} />
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
      <NeedsPassword onClose={toggleShowConfig} onMnemonic={setMnemonic} />
    </Container>
  )
}
