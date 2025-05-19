import { readLogsFromStorage, saveLogsToStorage } from './storage'

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'start' | 'running' | 'success' | 'fail'

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

const logGeneric = (message: string, level: LogLevel, data?: any): void => {
  const log: LogLine = {
    data: data ? JSON.stringify(data) : undefined,
    timestamp: Date.now(),
    message,
    level,
  }
  addLog(log)
  if (['fail', 'error'].includes(level)) console.error(message, data ?? '')
  else console.log(message, data ?? '')
}

export const logInfo = (message: string, data?: any): void => {
  logGeneric(message, 'info', data)
}

export const logError = (message: string, data?: any): void => {
  logGeneric(message, 'error', data)
}

export const logStart = (message: string, data?: any): void => {
  logGeneric(message, 'start', data)
}

export const logRunning = (message: string, data?: any): void => {
  logGeneric(message, 'running', data)
}

export const logSuccess = (message: string, data?: any): void => {
  logGeneric(message, 'success', data)
}

export const logFail = (message: string, data?: any): void => {
  logGeneric(message, 'fail', data)
}
