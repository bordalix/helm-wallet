import { getBoltzOnionUrl } from './boltz'
import { fetchURL } from './fetch'

export const boltzOnionUrl = 'http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api'
export const explorerOnionUrl = 'http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/'

export const checkTorConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    fetchURL(`${getBoltzOnionUrl()}/v2/swap/submarine`)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}
