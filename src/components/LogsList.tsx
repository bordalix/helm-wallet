import { prettyAgo, prettyUnixTimestamp } from '../lib/format'
import { LogLine, Logs } from '../lib/logs'
import { useState } from 'react'
import Modal from './Modal'
import { copyToClipboard } from '../lib/clipboard'
import {
  LogoErrorIcon,
  LogoFailIcon,
  LogoInfoIcon,
  LogoRunningIcon,
  LogoStartIcon,
  LogoSuccessIcon,
} from '../icons/Logs'

export default function LogsList({ logs }: { logs: Logs }) {
  const [clickedLog, setClickedLog] = useState<LogLine>()
  const [buttonLabel, setButtonLabel] = useState('Copy to clipboard')

  const logKey = (log: LogLine) => `${log.level}-${log.timestamp}-${log.message}`

  const logColor = (log: LogLine): string => {
    switch (log.level) {
      case 'info':
        return 'text-gray-500'
      case 'error':
        return 'text-red-500'
      case 'start':
        return 'text-gray-800 dark:text-gray-200'
      case 'running':
        return 'text-gray-800 dark:text-gray-200'
      case 'success':
        return 'text-green-500'
      case 'fail':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const logIcon = (log: LogLine): JSX.Element => {
    switch (log.level) {
      case 'info':
        return <LogoInfoIcon />
      case 'error':
        return <LogoErrorIcon />
      case 'start':
        return <LogoStartIcon />
      case 'running':
        return <LogoRunningIcon />
      case 'success':
        return <LogoSuccessIcon />
      case 'fail':
        return <LogoFailIcon />
      default:
        return <LogoInfoIcon />
    }
  }

  const handleCopy = () => {
    if (!clickedLog?.data) return
    copyToClipboard(clickedLog?.data)
    setButtonLabel('Copied')
    setTimeout(() => setButtonLabel('Copy to clipboard'), 1000)
  }

  const className = 'cursor-pointer flex items-center justify-between'

  return (
    <div className='mt-4'>
      <div className='flex flex-col h-80 overflow-auto gap-2'>
        {logs.map((log) => (
          <div key={logKey(log)} className={className} onClick={() => setClickedLog(log)}>
            <div className='flex items-center gap-2'>
              {logIcon(log)}
              <p>{log.message}</p>
            </div>
            <p className='text-gray-500'>{prettyAgo(log.timestamp)}</p>
          </div>
        ))}
      </div>
      {clickedLog ? (
        <Modal open={Boolean(clickedLog)} onClose={() => setClickedLog(undefined)}>
          <div className='flex flex-col gap-2 text-gray-900 dark:text-white'>
            <p className={logColor(clickedLog) + ' capitalize'}>{clickedLog.level}</p>
            <p className='text-xs text-gray-500'>{prettyUnixTimestamp(clickedLog.timestamp)}</p>
            <p>{clickedLog.message}</p>
            <p className='bg-gray-100 dark:bg-gray-800 max-h-80 max-w-80 text-sm break-all overflow-y-auto'>
              {clickedLog.data}
            </p>
            {clickedLog.data ? (
              <button className='text-sm text-gray-500 mt-2' onClick={handleCopy}>
                {buttonLabel}
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
