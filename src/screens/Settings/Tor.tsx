import { useContext } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Container from '../../components/Container'
import Content from '../../components/Content'
import Select from '../../components/Select'
import { formatInvoice } from '../../lib/format'
import { boltzOnionAddress } from '../../lib/constants'

export default function Tor() {
  const { config, toggleShowConfig, updateConfig } = useContext(ConfigContext)

  const handleChange = (e: any) => {
    updateConfig({ ...config, tor: e.target.value === '1' })
  }

  console.log(config)

  return (
    <Container>
      <Content>
        <Title text='Tor' subtext='Go fully anonymous' />
        <Select onChange={handleChange} value={config.tor}>
          <option value={1}>On</option>
          <option value={0}>Off</option>
        </Select>
        <div className='flex flex-col gap-4 mt-10'>
          <p>
            To use Tor, open this site on the{' '}
            <a href='https://www.torproject.org/' className='pointer-cursor underline'>
              Tor Browser
            </a>
          </p>
          {config.tor ? (
            <p>
              Boltz onion address
              <br />
              <a className='pointer-cursor underline' href={boltzOnionAddress}>
                {formatInvoice(boltzOnionAddress)}
              </a>
              <br />
              doesn't work on Testnet
            </p>
          ) : null}
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
