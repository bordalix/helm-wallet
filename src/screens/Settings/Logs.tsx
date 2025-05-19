import { useContext, useState } from 'react'
import Button from '../../components/Button'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import Title from '../../components/Title'
import { ConfigContext } from '../../providers/config'
import Content from '../../components/Content'
import { deleteLogs, getLogs } from '../../lib/logs'
import LogsList from '../../components/LogsList'

export default function Logs() {
  const { toggleShowConfig } = useContext(ConfigContext)

  const [logs, setLogs] = useState(getLogs())

  const handleDeleteLogs = () => {
    deleteLogs()
    setLogs([])
  }

  return (
    <div className='flex flex-col h-full justify-between'>
      <Content>
        <Title text='Logs' subtext='Removed after 7 days' />
        {logs.length === 0 ? <p className='text-gray-500 text-center'>No logs available</p> : <LogsList logs={logs} />}
      </Content>
      <ButtonsOnBottom>
        <Button onClick={handleDeleteLogs} label='Delete all logs' disabled={logs.length === 0} />
        <Button onClick={toggleShowConfig} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </div>
  )
}
