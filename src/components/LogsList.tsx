import { prettyAgo, prettyUnixTimestamp } from '../lib/format'
import { LogLine, Logs } from '../lib/logs'
import { useState } from 'react'
import Modal from './Modal'
import { copyToClipboard } from '../lib/clipboard'

export default function LogsList({ logs }: { logs: Logs }) {
  const [clickedLog, setClickedLog] = useState<LogLine>()

  const logKey = (log: LogLine) => `${log.level}-${log.timestamp}-${log.message}`

  const logColor = (log: LogLine) => {
    switch (log.level) {
      case 'info':
        return 'text-gray-500'
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      case 'debug':
        return 'text-blue-500'
      default:
        break
    }
  }

  return (
    <div className='mt-4'>
      <div className='flex flex-col h-80 overflow-auto gap-2'>
        {logs.map((log) => (
          <div
            key={logKey(log)}
            className='cursor-pointer flex items-center justify-between'
            onClick={() => setClickedLog(log)}
          >
            <div className='flex items-center gap-2'>
              <p className={logColor(log)}>o</p>
              <p>{log.message}</p>
            </div>
            <p className='text-gray-500'>{prettyAgo(log.timestamp)}</p>
          </div>
        ))}
      </div>
      {clickedLog ? (
        <Modal open={Boolean(clickedLog)} onClose={() => setClickedLog(undefined)}>
          <div className='flex flex-col gap-2'>
            <p className={logColor(clickedLog)}>{clickedLog.level}</p>
            <p className='text-xs text-gray-500'>{prettyUnixTimestamp(clickedLog.timestamp)}</p>
            <p>{clickedLog.message}</p>
            <p className='bg-gray-100 max-h-80 text-sm break-all overflow-y-auto'>{clickedLog.data}</p>
            {clickedLog.data ? (
              <button className='text-sm text-gray-500' onClick={() => copyToClipboard(clickedLog.data)}>
                Copy to clipboard
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
