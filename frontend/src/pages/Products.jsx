import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI } from '../services/api'
import toast from 'react-hot-toast'

function StockBadge({ qty, threshold, expiry }) {
  const today = new Date()
  const expiryDate = expiry ? new Date(expiry) : null
  if (expiryDate && expiryDate <= today)
    return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Expired</span>
  if (qty <= 0)
    return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Critical</span>
  if (qty <= threshold)
    return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Low</span>
  return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">OK</span>
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', category: '', stock_qty: '',
    unit_price: '', expiry_date: '', reorder_threshold: 10
  })
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const pageSize = 10

  useEffect(() => {
    loadProducts()
  }, [page, keyword, category, status])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productsAPI.getAll({
        page, page_size: pageSize,
        keyword: keyword || undefined,
        category: category || undefined,
        status: status || undefined
      })
      setProducts(res.data.products)
      setTotal(res.data.total)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required'
    if (!form.sku) e.sku = 'SKU is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.stock_qty || form.stock_qty < 0) e.stock_qty = 'Valid stock quantity required'
    if (!form.unit_price || form.unit_price <= 0) e.unit_price = 'Valid price required'
    if (form.expiry_date && new Date(form.expiry_date) <= new Date()) e.expiry_date = 'Expiry must be a future date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await productsAPI.create({
        ...form,
        stock_qty: parseInt(form.stock_qty),
        unit_price: parseFloat(form.unit_price),
        reorder_threshold: parseInt(form.reorder_threshold),
        expiry_date: form.expiry_date || null
      })
      toast.success('Product created!')
      setShowForm(false)
      setForm({ name: '', sku: '', category: '', stock_qty: '', unit_price: '', expiry_date: '', reorder_threshold: 10 })
      loadProducts()
    } catch {
      toast.error('Failed to create product')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsAPI.delete(id)
      toast.success('Product deleted')
      loadProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {[
              { label: 'Product Name', key: 'name', type: 'text' },
              { label: 'SKU', key: 'sku', type: 'text' },
              { label: 'Category', key: 'category', type: 'text' },
              { label: 'Stock Quantity', key: 'stock_qty', type: 'number' },
              { label: 'Unit Price', key: 'unit_price', type: 'number' },
              { label: 'Expiry Date', key: 'expiry_date', type: 'date' },
              { label: 'Reorder Threshold', key: 'reorder_threshold', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
            <div className="col-span-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Create Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search products..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No products found. Add your first product!</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'SKU', 'Category', 'Stock', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category}</td>
                  <td className="px-4 py-3">{p.stock_qty}</td>
                  <td className="px-4 py-3">₹{p.unit_price}</td>
                  <td className="px-4 py-3">
                    <StockBadge qty={p.stock_qty} threshold={p.reorder_threshold} expiry={p.expiry_date} />
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}