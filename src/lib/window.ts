export const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints

export const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1

export const userAgent = window.navigator.userAgent
