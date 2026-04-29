import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import PrivateRoute from './components/ui/PrivateRoute'
import Navbar from './components/ui/Navbar'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import InvoiceUpload from './pages/InvoiceUpload'
import Reports from './pages/Reports'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/products" element={
          <PrivateRoute>
            <Layout><Products /></Layout>
          </PrivateRoute>
        } />
        <Route path="/products/:id" element={
          <PrivateRoute>
            <Layout><ProductDetail /></Layout>
          </PrivateRoute>
        } />
        <Route path="/suppliers" element={
          <PrivateRoute>
            <Layout><Suppliers /></Layout>
          </PrivateRoute>
        } />
        <Route path="/purchase-orders" element={
          <PrivateRoute>
            <Layout><PurchaseOrders /></Layout>
          </PrivateRoute>
        } />
        <Route path="/invoices" element={
          <PrivateRoute>
            <Layout><InvoiceUpload /></Layout>
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <Layout><Reports /></Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}