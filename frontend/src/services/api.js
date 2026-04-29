import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return API.post('/auth/login', form)
  },
  register: (data) => API.post('/auth/register', data),
}

export const productsAPI = {
  getAll: (params) => API.get('/products/', { params }),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products/', data),
  update: (id, data) => API.patch(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  getHistory: (id) => API.get(`/products/${id}/history`),
  getForecast: (id) => API.get(`/products/${id}/forecast`),
}

export const suppliersAPI = {
  getAll: () => API.get('/suppliers/'),
  getById: (id) => API.get(`/suppliers/${id}`),
  create: (data) => API.post('/suppliers/', data),
  update: (id, data) => API.patch(`/suppliers/${id}`, data),
  delete: (id) => API.delete(`/suppliers/${id}`),
}

export const poAPI = {
  getAll: (params) => API.get('/purchase-orders/', { params }),
  getById: (id) => API.get(`/purchase-orders/${id}`),
  create: (data) => API.post('/purchase-orders/', data),
  updateStatus: (id, status) => API.patch(`/purchase-orders/${id}/status`, { status }),
  sendEmail: (id) => API.post(`/purchase-orders/${id}/send-email`),
}

export const aiAPI = {
  chat: (messages) => API.post('/ai/chat', { messages }),
}

export const invoicesAPI = {
  parse: (file) => {
    const form = new FormData()
    form.append('file', file)
    return API.post('/invoices/parse', form)
  },
  confirmReceipt: (data) => API.post('/invoices/confirm-receipt', data),
}

export const reportsAPI = {
  getLogs: () => API.get('/reports/logs'),
  getReports: () => API.get('/reports/'),
  triggerLowStock: () => API.post('/reports/trigger/low-stock'),
  triggerExpiry: () => API.post('/reports/trigger/expiry'),
}