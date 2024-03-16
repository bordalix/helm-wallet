import { Config } from '../providers/config'

export const getBoltzApiUrl = ({ network }: Config) =>
  network === 'testnet' ? 'https://testnet.boltz.exchange/api' : 'https://api.boltz.exchange'

export const getBoltzWsUrl = (config: Config) => `${getBoltzApiUrl(config).replace('https://', 'ws://')}/v2/ws`
