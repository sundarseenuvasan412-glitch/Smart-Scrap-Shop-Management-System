import { useEffect, useMemo, useState } from 'react'
import {
  confirmAdminOrderPrice,
  getAdminOrders,
  markAdminOrderPaymentReceived,
  updateAdminOrderStatus,
} from '../services/orderService'

const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function apiError(error) {
  return error.response?.data?.message || 'Could not update orders. Please try again.'
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  const selectedOrder = orders.find((order) => order.orderNumber === selectedId)
  const finalAmount = useMemo(
    () => lines.reduce((total, item) => total + (Number(item.finalTotal) || 0), 0),
    [lines],
  )

  async function loadOrders() {
    setErrorMessage('')
    try {
      const results = await getAdminOrders()
      setOrders(results)
    } catch (error) {
      setErrorMessage(apiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAdminOrders()
      .then(setOrders)
      .catch((error) => setErrorMessage(apiError(error)))
      .finally(() => setLoading(false))
  }, [])

  function selectOrder(order) {
    setSelectedId(order.orderNumber)
    setLines(order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantityKg: item.quantityKg,
      pricePerKg: item.pricePerKg,
      confirmedWeightKg: item.confirmedWeightKg ?? item.quantityKg,
      finalTotal: item.finalTotal ?? item.estimatedTotal,
    })))
    setErrorMessage('')
    setNotice('')
  }

  function updateLine(id, field, value) {
    setLines((current) => current.map((item) => {
      if (item.id !== id) return item
      if (field === 'confirmedWeightKg') {
        const weight = Number(value)
        return {
          ...item,
          confirmedWeightKg: value,
          finalTotal: Number.isFinite(weight) ? (weight * Number(item.pricePerKg)).toFixed(2) : '',
        }
      }
      return { ...item, [field]: value }
    }))
  }

  async function saveFinalPrice(event) {
    event.preventDefault()
    if (!selectedOrder) return
    setSaving(true)
    setErrorMessage('')
    setNotice('')
    try {
      const updated = await confirmAdminOrderPrice(selectedOrder.orderNumber, {
        finalAmount: finalAmount.toFixed(2),
        items: lines.map((item) => ({
          id: item.id,
          confirmedWeightKg: item.confirmedWeightKg,
          finalTotal: item.finalTotal,
        })),
      })
      setOrders((current) => current.map((order) => order.orderNumber === updated.orderNumber ? updated : order))
      selectOrder(updated)
      setNotice('Final weights and pricing saved.')
    } catch (error) {
      setErrorMessage(apiError(error))
    } finally {
      setSaving(false)
    }
  }

  async function markPaymentReceived() {
    if (!selectedOrder) return
    setSaving(true)
    setErrorMessage('')
    setNotice('')
    try {
      const updated = await markAdminOrderPaymentReceived(selectedOrder.orderNumber)
      setOrders((current) => current.map((order) => order.orderNumber === updated.orderNumber ? updated : order))
      selectOrder(updated)
      setNotice('Payment recorded as received.')
    } catch (error) {
      setErrorMessage(apiError(error))
    } finally {
      setSaving(false)
    }
  }

  async function changeOrderStatus(event) {
    if (!selectedOrder) return
    const status = event.target.value
    setSaving(true)
    setErrorMessage('')
    setNotice('')
    try {
      const updated = await updateAdminOrderStatus(selectedOrder.orderNumber, status)
      setOrders((current) => current.map((order) => order.orderNumber === updated.orderNumber ? updated : order))
      selectOrder(updated)
      setNotice('Order status updated.')
    } catch (error) {
      setErrorMessage(apiError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-management admin-orders-page">
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">SALES</p><h1>Orders</h1><p>Review customer requests and confirm final weights and pricing.</p></div>
        <button className="admin-button admin-button-quiet" type="button" onClick={loadOrders} disabled={loading}>Refresh orders</button>
      </div>
      {errorMessage && <p className="admin-alert" role="alert">{errorMessage}</p>}
      {notice && <p className="admin-management-notice" role="status">{notice}</p>}
      {loading ? <p>Loading orders…</p> : orders.length === 0 ? (
        <div className="admin-management-empty"><strong>No customer orders yet</strong><p>New orders will appear here after customers check out.</p></div>
      ) : (
        <div className="admin-orders-grid">
          <div className="admin-panel admin-order-list">
            {orders.map((order) => (
              <button
                className={`admin-order-list-item${selectedId === order.orderNumber ? ' selected' : ''}`}
                type="button"
                key={order.orderNumber}
                onClick={() => selectOrder(order)}
              >
                <span><strong>{order.orderNumber}</strong><small>{order.customerName} · {order.items.length} product(s)</small></span>
                <span className="admin-order-list-total">{currency(order.finalAmount ?? order.estimatedAmount)}<small>{order.finalAmount == null ? 'Estimated' : 'Final'}</small></span>
              </button>
            ))}
          </div>
          {selectedOrder && (
            <section className="admin-panel admin-order-detail">
              <header className="admin-order-detail-heading">
                <div><p className="admin-eyebrow">ORDER DETAILS</p><h2>{selectedOrder.orderNumber}</h2></div>
                <label className="admin-order-status-control">Order status
                  <select value={selectedOrder.status} onChange={changeOrderStatus} disabled={saving} aria-label={`Update status for ${selectedOrder.orderNumber}`}>
                    {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </header>
              <dl className="admin-order-customer">
                <div><dt>Customer</dt><dd>{selectedOrder.customerName}</dd></div>
                <div><dt>Contact</dt><dd>{selectedOrder.customerEmail} · {selectedOrder.customerPhone}</dd></div>
                <div><dt>Address</dt><dd>{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} {selectedOrder.pincode}</dd></div>
                <div><dt>Fulfilment</dt><dd>{selectedOrder.fulfillmentType}: {selectedOrder.fulfillmentAddress}</dd></div>
                <div><dt>Preferred date / time</dt><dd>{selectedOrder.preferredDate} · {selectedOrder.preferredTime}</dd></div>
                <div><dt>Payment</dt><dd>{selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}</dd></div>
              </dl>
              {selectedOrder.instructions && <p className="admin-order-instructions"><strong>Instructions:</strong> {selectedOrder.instructions}</p>}
              <form className="admin-order-confirm-form" onSubmit={saveFinalPrice}>
                <h3>Confirm product weights and final prices</h3>
                {lines.map((item) => (
                  <div className="admin-order-line" key={item.id}>
                    <strong>{item.productName}<small>Estimate: {item.quantityKg} kg · {currency(item.pricePerKg)} / kg</small></strong>
                    <label>Final weight (kg)<input type="number" min="0.001" step="0.001" value={item.confirmedWeightKg} onChange={(event) => updateLine(item.id, 'confirmedWeightKg', event.target.value)} required /></label>
                    <label>Final product total<input type="number" min="0" step="0.01" value={item.finalTotal} onChange={(event) => updateLine(item.id, 'finalTotal', event.target.value)} required /></label>
                  </div>
                ))}
                <div className="admin-order-total"><span>Estimated total</span><strong>{currency(selectedOrder.estimatedAmount)}</strong></div>
                <div className="admin-order-total"><span>Final amount</span><strong>{currency(finalAmount)}</strong></div>
                <button className="admin-button admin-button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save final weights and price'}</button>
              </form>
              {selectedOrder.finalAmount != null && selectedOrder.paymentStatus === 'PENDING' && (
                <button className="admin-button admin-button-quiet admin-order-payment-action" type="button" onClick={markPaymentReceived} disabled={saving}>
                  Mark cash payment received
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </section>
  )
}
