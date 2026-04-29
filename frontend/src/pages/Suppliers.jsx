import { useState, useEffect } from 'react'
import { suppliersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', categories: '', lead_time_days: 3
  })
  const [errors, setErrors] = useState({})

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const res = await suppliersAPI.getAll()
      setSuppliers(res.data)
    } catch {
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.lead_time_days < 1) e.lead_time_days = 'Lead time must be at least 1 day'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      categories: form.categories.split(',').map(c => c.trim()).filter(Boolean),
      lead_time_days: parseInt(form.lead_time_days)
    }
    try {
      if (editingId) {
        await suppliersAPI.update(editingId, data)
        toast.success('Supplier updated!')
      } else {
        await suppliersAPI.create(data)
        toast.success('Supplier created!')
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', email: '', categories: '', lead_time_days: 3 })
      loadSuppliers()
    } catch {
      toast.error('Failed to save supplier')
    }
  }

  const handleEdit = (supplier) => {
    setForm({
      name: supplier.name,
      email: supplier.email,
      categories: supplier.categories.join(', '),
      lead_time_days: supplier.lead_time_days
    })
    setEditingId(supplier.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    try {
      await suppliersAPI.delete(id)
      toast.success('Supplier deleted')
      loadSuppliers()
    } catch {
      toast.error('Failed to delete supplier')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', email: '', categories: '', lead_time_days: 3 }) }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma separated)</label>
              <input
                type="text"
                value={form.categories}
                onChange={(e) => setForm({ ...form, categories: e.target.value })}
                placeholder="Grains, Pulses, Dairy"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={form.lead_time_days}
                onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lead_time_days && <p className="text-red-500 text-xs mt-1">{errors.lead_time_days}</p>}
            </div>
            <div className="col-span-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                {editingId ? 'Update Supplier' : 'Create Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No suppliers yet. Add your first supplier!</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Categories', 'Lead Time', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.categories.join(', ') || 'N/A'}</td>
                  <td className="px-4 py-3">{s.lead_time_days} days</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}