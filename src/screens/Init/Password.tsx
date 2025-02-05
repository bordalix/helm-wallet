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
import Error from '../../components/Error'
import CenterScreen from '../../components/CenterScreen'

export default function InitPassword() {
  const { initInfo } = useContext(FlowContext)
  const { navigate } = useContext(NavigationContext)
  const { restoreWallet, wallet } = useContext(WalletContext)

  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const [password, setPassword] = useState('')
  const [useBiometrics, setUseBiometrics] = useState(isBiometricsSupported)

  const proceed = (password: string, lockedByBiometrics = true) => {
    saveMnemonicToStorage(initInfo.mnemonic, password)
    getMasterKeys(initInfo.mnemonic).then(({ masterBlindingKey, xpubs }) => {
      restoreWallet({ ...wallet, lockedByBiometrics, masterBlindingKey, xpubs, initialized: true })
      navigate(Pages.Wallet)
    })
  }

  useEffect(() => {
    if (!useBiometrics) return
    registerUser()
      .then(proceed)
      .catch(() => {
        setError('Biometrics failed, use password instead')
        setUseBiometrics(false)
      })
  }, [useBiometrics])

  const handleCancel = () => navigate(Pages.Init)

  const handleClick = () => proceed(password, false)

  return (
    <Container>
      <Content>
        <Title text='Password' subtext={useBiometrics ? 'Use biometrics' : 'Define your password'} />
        <Error error={Boolean(error)} text={error} />
        {useBiometrics ? (
          <CenterScreen>
            <FingerprintIcon />
          </CenterScreen>
        ) : (
          <NewPassword onNewPassword={setPassword} setLabel={setLabel} />
        )}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleClick} label={label} disabled={!password} />
        <Button onClick={handleCancel} label='Cancel' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
