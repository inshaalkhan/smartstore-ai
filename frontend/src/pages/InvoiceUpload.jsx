import { useState } from 'react'
import { invoicesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function InvoiceUpload() {
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editedData, setEditedData] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setParsed(null)
    setEditedData(null)
  }

  const handleParse = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }
    setLoading(true)
    try {
      const res = await invoicesAPI.parse(file)
      setParsed(res.data)
      setEditedData(res.data)
      toast.success('Invoice parsed successfully!')
    } catch {
      toast.error('Failed to parse invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await invoicesAPI.confirmReceipt(editedData)
      toast.success(res.data.message)
      setParsed(null)
      setEditedData(null)
      setFile(null)
    } catch {
      toast.error('Failed to confirm receipt')
    } finally {
      setConfirming(false)
    }
  }

  const updateLineItem = (index, field, value) => {
    const updated = { ...editedData }
    updated.line_items = [...updated.line_items]
    updated.line_items[index] = { ...updated.line_items[index], [field]: value }
    setEditedData(updated)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invoice Upload & OCR Parser</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Upload Invoice</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <p className="text-gray-400 mb-3">Upload a supplier invoice (JPG or PNG)</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 text-sm"
          >
            Choose File
          </label>
          {file && (
            <p className="text-sm text-gray-600 mt-3">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleParse}
          disabled={!file || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Parsing invoice...' : 'Parse Invoice'}
        </button>
      </div>

      {editedData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4">Parsed Invoice Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Review and edit the extracted data before confirming.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                value={editedData.supplier_name || ''}
                onChange={(e) => setEditedData({ ...editedData, supplier_name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={editedData.invoice_date || ''}
                onChange={(e) => setEditedData({ ...editedData, invoice_date: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-sm mb-2">Line Items</h3>
          <table className="w-full text-sm mb-4">
            <thead className="bg-gray-50">
              <tr>
                {['Product Name', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editedData.line_items?.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                      className="w-20 border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      className="w-28 border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    ₹{(item.qty * item.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center">
            <p className="font-semibold">
              Grand Total: ₹{editedData.grand_total || 0}
            </p>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : 'Confirm & Update Stock'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}