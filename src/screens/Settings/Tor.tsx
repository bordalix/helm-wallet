import { useContext, useEffect, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Container from '../../components/Container'
import Content from '../../components/Content'
import Select from '../../components/Select'
import { formatInvoice } from '../../lib/format'
import { WalletContext } from '../../providers/wallet'
import { NetworkName } from '../../lib/network'
import Error from '../../components/Error'
import { boltzOnionUrl, checkTorConnection, wsOnionUrl } from '../../lib/tor'
import Loading from '../../components/Loading'
import { ConnectionContext } from '../../providers/connection'

export default function Tor() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)
  const { tor } = useContext(ConnectionContext)
  const { wallet } = useContext(WalletContext)

  const [checking, setChecking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [startTor, setStartTor] = useState(false)

  useEffect(() => {
    if (wallet.network !== NetworkName.Liquid) setErrorMsg("Tor doesn't work on Testnet")
  }, [wallet.network])

  useEffect(() => {
    if (startTor) {
      setErrorMsg('')
      setStartTor(false)
      setChecking(true)
      checkTorConnection().then((ok) => {
        if (ok) updateConfig({ ...config, tor: true })
        else setErrorMsg('Unable to connect to Tor')
        setChecking(false)
      })
    }
  }, [startTor])

  const handleChange = async (e: any) => {
    if (e.target.value === '1') setStartTor(true)
    else updateConfig({ ...config, tor: false })
  }

  const disabled = wallet.network !== NetworkName.Liquid

  return (
    <Container>
      <Content>
        <Title text='Tor' subtext='Go fully anonymous' />
        <Error error={Boolean(errorMsg)} text={errorMsg} />
        <Select disabled={disabled} onChange={handleChange} value={config.tor}>
          <option value={1}>On</option>
          <option value={0}>Off</option>
        </Select>
        <div className='flex flex-col gap-6 mt-10'>
          {tor ? (
            <>
              <p className='font-semibold'>Connected to Tor</p>
              <p>
                Using{' '}
                <a className='pointer-cursor underline' href={boltzOnionUrl}>
                  {formatInvoice(boltzOnionUrl)}
                </a>
              </p>
              <p>
                and{' '}
                <a className='pointer-cursor underline' href={wsOnionUrl()}>
                  {formatInvoice(wsOnionUrl())}
                </a>
              </p>
            </>
          ) : checking ? (
            <>
              <Loading />
              <p>Checking connection...</p>
            </>
          ) : (
            <p>
              To use Tor, open this site on the{' '}
              <a href='https://www.torproject.org/' className='pointer-cursor underline'>
                Tor Browser
              </a>
            </p>
          )}
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
