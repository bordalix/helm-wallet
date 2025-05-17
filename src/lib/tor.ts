import { fetchURL } from './fetch'

const blockstream = 'explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion'

export const boltzOnionUrl = 'http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api'
export const explorerOnionUrl = `http://${blockstream}/`
export const wsOnionUrl = (): string => {
  const url = `://${blockstream}/liquid/electrum-websocket/api`
  return (window.location.protocol === 'https:' ? 'wss' : 'ws') + url
}

export const checkTorConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    fetchURL(`${boltzOnionUrl}/v2/swap/submarine`)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}
