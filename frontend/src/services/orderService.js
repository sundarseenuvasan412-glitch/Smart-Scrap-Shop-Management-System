import api from './api'

export async function getCustomerProfile() {
  const response = await api.get('/users/me')
  return response.data
}

export async function createCustomerOrder(order) {
  const response = await api.post('/orders', order)
  return response.data
}

export async function getCustomerOrders() {
  const response = await api.get('/orders')
  return response.data
}

export async function getCustomerOrder(orderNumber) {
  const response = await api.get(`/orders/${encodeURIComponent(orderNumber)}`)
  return response.data
}

export async function getAdminOrders() {
  const response = await api.get('/admin/orders')
  return response.data
}

export async function confirmAdminOrderPrice(orderNumber, confirmation) {
  const response = await api.put(`/admin/orders/${encodeURIComponent(orderNumber)}/final-price`, confirmation)
  return response.data
}

export async function markAdminOrderPaymentReceived(orderNumber) {
  const response = await api.patch(`/admin/orders/${encodeURIComponent(orderNumber)}/payment-received`)
  return response.data
}

export async function updateAdminOrderStatus(orderNumber, status) {
  const response = await api.patch(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, { status })
  return response.data
}
