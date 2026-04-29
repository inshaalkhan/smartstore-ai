import { useState, useEffect } from 'react'
import { reportsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Reports() {
  const [logs, setLogs] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [triggering, setTriggering] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [logsRes, reportsRes] = await Promise.all([
        reportsAPI.getLogs(),
        reportsAPI.getReports()
      ])
      setLogs(logsRes.data)
      setReports(reportsRes.data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async (type) => {
    setTriggering(type)
    try {
      if (type === 'low-stock') {
        await reportsAPI.triggerLowStock()
        toast.success('Low stock alert job triggered!')
      } else {
        await reportsAPI.triggerExpiry()
        toast.success('Expiry alert job triggered!')
      }
      setTimeout(loadAll, 1000)
    } catch {
      toast.error('Failed to trigger job')
    } finally {
      setTriggering('')
    }
  }

  const STATUS_COLORS = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reports & Automation</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-2">Low Stock Alert Agent</h2>
          <p className="text-sm text-gray-500 mb-4">
            Checks all products below reorder threshold and creates draft POs automatically.
            Runs daily at 8:00 AM.
          </p>
          <button
            onClick={() => handleTrigger('low-stock')}
            disabled={triggering === 'low-stock'}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {triggering === 'low-stock' ? 'Running...' : 'Trigger Now'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-2">Expiry Alert Agent</h2>
          <p className="text-sm text-gray-500 mb-4">
            Scans for products expiring within 14 days and generates a markdown report
            with suggested actions. Runs daily at 8:30 AM.
          </p>
          <button
            onClick={() => handleTrigger('expiry')}
            disabled={triggering === 'expiry'}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {triggering === 'expiry' ? 'Running...' : 'Trigger Now'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Automation Logs</h2>
        {loading ? (
          <div className="text-center py-6 text-gray-400">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No automation logs yet. Trigger a job above!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Job Name', 'Run At', 'Status', 'Summary'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{log.job_name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(log.run_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.result_summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4">Generated Reports</h2>
        {reports.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No reports generated yet. Trigger the expiry alert job!
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium capitalize">{report.type.replace('_', ' ')}</span>
                    <span className="text-gray-400 text-sm ml-3">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedReport(
                      selectedReport?.id === report.id ? null : report
                    )}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    {selectedReport?.id === report.id ? 'Hide' : 'View Report'}
                  </button>
                </div>
                {selectedReport?.id === report.id && (
                  <div className="mt-3 bg-gray-50 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {report.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}