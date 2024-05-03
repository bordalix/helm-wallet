import { getBoltzOnionUrl } from './boltz'
import { fetchURL } from './fetch'

export const checkTorConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    fetchURL(`${getBoltzOnionUrl()}/v2/swap/submarine`)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}
