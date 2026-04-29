import { useState, useEffect } from 'react'
import { poAPI, suppliersAPI } from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700',
}

const NEXT_STATUS = {
  draft: 'sent',
  sent: 'acknowledged',
  acknowledged: 'received',
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [lineItems, setLineItems] = useState([
    { product_name: '', qty: '', unit_price: '' }
  ])
  const [errors, setErrors] = useState({})

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [poRes, supRes] = await Promise.all([
        poAPI.getAll(),
        suppliersAPI.getAll()
      ])
      setOrders(poRes.data)
      setSuppliers(supRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!supplierId) e.supplier = 'Please select a supplier'
    if (lineItems.some(i => !i.product_name || !i.qty || !i.unit_price)) {
      e.items = 'All line item fields are required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await poAPI.create({
        supplier_id: parseInt(supplierId),
        line_items: lineItems.map(i => ({
          product_name: i.product_name,
          qty: parseInt(i.qty),
          unit_price: parseFloat(i.unit_price)
        }))
      })
      toast.success('Purchase order created!')
      setShowForm(false)
      setSupplierId('')
      setLineItems([{ product_name: '', qty: '', unit_price: '' }])
      loadAll()
    } catch {
      toast.error('Failed to create purchase order')
    }
  }

  const handleStatusUpdate = async (id, currentStatus) => {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    try {
      await poAPI.updateStatus(id, next)
      toast.success(`PO status updated to ${next}`)
      loadAll()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleSendEmail = async (id) => {
    try {
      await poAPI.sendEmail(id)
      toast.success('PO email sent (mocked)')
    } catch {
      toast.error('Failed to send email')
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { product_name: '', qty: '', unit_price: '' }])
  }

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    setLineItems(updated)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Create PO'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Create Purchase Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={item.product_name}
                    onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Unit price"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                    className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-500 text-sm px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {errors.items && <p className="text-red-500 text-xs mt-1">{errors.items}</p>}
              <button
                type="button"
                onClick={addLineItem}
                className="text-blue-600 text-sm hover:underline mt-1"
              >
                + Add line item
              </button>
            </div>

            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Create Purchase Order
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-lg shadow">
            No purchase orders yet. Create your first one!
          </div>
        ) : (
          orders.map(po => (
            <div key={po.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">PO #{po.id}</p>
                  <p className="text-sm text-gray-500">
                    Supplier ID: {po.supplier_id} · {new Date(po.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[po.status]}`}>
                    {po.status.toUpperCase()}
                  </span>
                  {NEXT_STATUS[po.status] && (
                    <button
                      onClick={() => handleStatusUpdate(po.id, po.status)}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      Mark as {NEXT_STATUS[po.status]}
                    </button>
                  )}
                  {po.status === 'draft' && (
                    <button
                      onClick={() => handleSendEmail(po.id)}
                      className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100"
                    >
                      Send Email
                    </button>
                  )}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {po.line_items.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">{item.product_name}</td>
                      <td className="px-3 py-2">{item.qty}</td>
                      <td className="px-3 py-2">₹{item.unit_price}</td>
                      <td className="px-3 py-2 font-medium">₹{(item.qty * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}