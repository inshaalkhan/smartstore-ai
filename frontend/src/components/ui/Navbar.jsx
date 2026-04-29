import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">SmartStore AI</span>
        <Link to="/" className="hover:underline text-sm">Dashboard</Link>
        <Link to="/products" className="hover:underline text-sm">Products</Link>
        <Link to="/suppliers" className="hover:underline text-sm">Suppliers</Link>
        <Link to="/purchase-orders" className="hover:underline text-sm">Purchase Orders</Link>
        <Link to="/invoices" className="hover:underline text-sm">Invoices</Link>
        <Link to="/reports" className="hover:underline text-sm">Reports</Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}