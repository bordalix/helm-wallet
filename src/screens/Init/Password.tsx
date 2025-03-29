import { useContext, useEffect, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { NavigationContext, Pages } from '../../providers/navigation'
import { getMasterKeys } from '../../lib/wallet'
import { WalletContext } from '../../providers/wallet'
import Content from '../../components/Content'
import NewPassword from '../../components/NewPassword'
import { saveMnemonicToStorage } from '../../lib/storage'
import { FlowContext } from '../../providers/flow'
import Container from '../../components/Container'
import { isBiometricsSupported, registerUser } from '../../lib/biometrics'
import FingerprintIcon from '../../icons/Fingerprint'
import CenterScreen from '../../components/CenterScreen'
import { extractError } from '../../lib/error'

export default function InitPassword() {
  const { initInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { restoreWallet, wallet } = useContext(WalletContext)

  const [label, setLabel] = useState('')
  const [password, setPassword] = useState('')
  const [useBiometrics, setUseBiometrics] = useState(isBiometricsSupported())

  const proceed = (password: string, passkeyId = '') => {
    saveMnemonicToStorage(initInfo.mnemonic, password)
    getMasterKeys(initInfo.mnemonic).then(({ masterBlindingKey, xpubs }) => {
      restoreWallet({
        ...wallet,
        lockedByBiometrics: passkeyId.length > 0,
        masterBlindingKey,
        passkeyId,
        xpubs,
        initialized: true,
      })
      navigate(Pages.Wallet)
    })
  }

  const registerUserBiometrics = () => {
    registerUser()
      .then(({ password, passkeyId }) => proceed(password, passkeyId))
      .catch((err) => console.error('Error registering user biometrics:', extractError(err)))
  }

  useEffect(() => {
    if (!useBiometrics) return
    registerUserBiometrics()
  }, [useBiometrics])

  const handleCancel = () => navigate(Pages.Init)

  const handlePassword = () => proceed(password)

  return (
    <Container>
      <Content>
        <Title text='Password' subtext={useBiometrics ? 'Use biometrics' : 'Define your password'} />
        {useBiometrics ? (
          <CenterScreen onClick={registerUserBiometrics}>
            <FingerprintIcon />
          </CenterScreen>
        ) : (
          <NewPassword onNewPassword={setPassword} setLabel={setLabel} />
        )}
      </Content>
      <ButtonsOnBottom>
        {useBiometrics ? (
          <Button onClick={() => setUseBiometrics(false)} label='Use password' />
        ) : (
          <Button onClick={handlePassword} label={label} disabled={!password} />
        )}
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
