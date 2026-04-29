import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productsAPI } from '../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [forecast, setForecast] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadAll()
  }, [id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [productRes, forecastRes, historyRes] = await Promise.all([
        productsAPI.getById(id),
        productsAPI.getForecast(id),
        productsAPI.getHistory(id),
      ])
      setProduct(productRes.data)
      setForm(productRes.data)
      setForecast(forecastRes.data.forecast)
      setHistory(historyRes.data)
    } catch {
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required'
    if (form.stock_qty < 0) e.stock_qty = 'Stock cannot be negative'
    if (form.unit_price <= 0) e.unit_price = 'Price must be positive'
    if (form.expiry_date && new Date(form.expiry_date) <= new Date()) e.expiry_date = 'Expiry must be future date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleUpdate = async () => {
    if (!validate()) return
    try {
      await productsAPI.update(id, {
        name: form.name,
        category: form.category,
        stock_qty: parseInt(form.stock_qty),
        unit_price: parseFloat(form.unit_price),
        reorder_threshold: parseInt(form.reorder_threshold),
        expiry_date: form.expiry_date || null
      })
      toast.success('Product updated!')
      setEditing(false)
      loadAll()
    } catch {
      toast.error('Failed to update product')
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading product...</div>
  if (!product) return <div className="text-center py-10 text-gray-400">Product not found</div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline text-sm">
          ← Back to Products
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-gray-500 text-sm">SKU: {product.sku}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            {editing ? 'Cancel' : 'Edit Product'}
          </button>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Name', key: 'name', type: 'text' },
              { label: 'Category', key: 'category', type: 'text' },
              { label: 'Stock Quantity', key: 'stock_qty', type: 'number' },
              { label: 'Unit Price', key: 'unit_price', type: 'number' },
              { label: 'Reorder Threshold', key: 'reorder_threshold', type: 'number' },
              { label: 'Expiry Date', key: 'expiry_date', type: 'date' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
            <div className="col-span-2">
              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Category', value: product.category },
              { label: 'Stock Quantity', value: product.stock_qty },
              { label: 'Unit Price', value: `₹${product.unit_price}` },
              { label: 'Reorder Threshold', value: product.reorder_threshold },
              { label: 'Expiry Date', value: product.expiry_date || 'N/A' },
              { label: 'Status', value: product.is_active ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">7-Day Demand Forecast</h2>
        {forecast.length === 0 ? (
          <p className="text-gray-400 text-sm">No forecast data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="predicted_demand"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Predicted Demand"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4">Stock History</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No stock history yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Date', 'Change', 'Reason'].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b">
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(h.created_at).toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-2 font-medium ${h.change_qty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {h.change_qty > 0 ? '+' : ''}{h.change_qty}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{h.reason || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}