import { useState, useEffect, useRef } from 'react'
import { productsAPI, aiAPI } from '../services/api'
import { Link } from 'react-router-dom'

function StatCard({ title, value, color }) {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, lowStock: 0, expired: 0, products: []
  })
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am SmartStore AI. Ask me anything about your inventory, suppliers, or orders.' }
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadStats = async () => {
    try {
      const [allRes, lowRes, expiredRes] = await Promise.all([
        productsAPI.getAll({ page: 1, page_size: 100 }),
        productsAPI.getAll({ status: 'low', page: 1, page_size: 5 }),
        productsAPI.getAll({ status: 'expired', page: 1, page_size: 5 }),
      ])
      setStats({
        total: allRes.data.total,
        lowStock: lowRes.data.total,
        expired: expiredRes.data.total,
        products: lowRes.data.products || []
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChatLoading(true)
    try {
      const apiMessages = newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0)
      const res = await aiAPI.chat(apiMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })))
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Loading dashboard...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Products" value={stats.total} color="border-blue-500" />
        <StatCard title="Low Stock Alerts" value={stats.lowStock} color="border-yellow-500" />
        <StatCard title="Expired Items" value={stats.expired} color="border-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-lg mb-4">Low Stock Products</h2>
          {stats.products.length === 0 ? (
            <p className="text-gray-400 text-sm">No low stock products. Everything looks good!</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Stock</th>
                  <th className="pb-2">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {stats.products.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link to={`/products/${p.id}`} className="text-blue-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-2 text-red-500 font-medium">{p.stock_qty}</td>
                    <td className="py-2 text-gray-500">{p.reorder_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/products" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
            View all products →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex flex-col h-96">
          <h2 className="font-semibold text-lg mb-3">AI Assistant</h2>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm max-w-xs lg:max-w-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your inventory..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}