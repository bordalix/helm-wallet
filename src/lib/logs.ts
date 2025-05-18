import { extractError } from './error'
import { readLogsFromStorage, saveLogsToStorage } from './storage'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export type LogLine = {
  timestamp: number
  level: LogLevel
  message: string
  data?: string
}

export type Logs = LogLine[]

const addLog = (log: LogLine): void => {
  saveLogsToStorage([...readLogsFromStorage(), log])
}

export const cleanOldLogs = (maxAgeInSeconds = 30 * 24 * 60 * 60): void => {
  const notOldLogs = getLogs().filter((log) => {
    const now = new Date()
    const logDate = new Date(log.timestamp)
    const diffInSeconds = Math.floor((now.getTime() - logDate.getTime()) / 1000)
    return diffInSeconds < maxAgeInSeconds
  })
  saveLogsToStorage(notOldLogs)
}

export const deleteLogs = (): void => {
  saveLogsToStorage([])
}

export const getLogs = (): Logs => {
  return readLogsFromStorage().sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return dateB.getTime() - dateA.getTime()
  })
}

export const getLog = (index: number): LogLine => {
  const logs = getLogs()
  if (index < 0 || index >= logs.length) {
    throw new Error('Log index out of bounds')
  }
  return logs[index]
}

export const consoleLog = (message: string, data?: any): void => {
  const log: LogLine = {
    timestamp: Date.now(),
    level: 'info',
    message,
    data: data ? JSON.stringify(data) : undefined,
  }
  addLog(log)
  console.log(message, data ?? '')
}

export const consoleError = (message: string, data?: any): void => {
  const log: LogLine = {
    timestamp: Date.now(),
    level: 'error',
    message,
    data: data ? JSON.stringify(data) : undefined,
  }
  addLog(log)
  console.error(message, extractError(data))
}
