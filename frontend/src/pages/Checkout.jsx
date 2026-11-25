import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getCustomerOrder, getCustomerOrders, getCustomerProfile, createCustomerOrder } from '../services/orderService'
import './Checkout.css'

const today = new Date()
const minimumCheckoutDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function orderError(error) {
  return error.response?.data?.message || 'We could not complete that request. Please try again.'
}

export function CheckoutPage({ cart, user, onOrderPlaced }) {
  const navigate = useNavigate()
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.material.price * item.weight, 0), [cart])
  const [details, setDetails] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fulfillmentType: 'PICKUP',
    preferredDate: '',
    preferredTime: '',
    instructions: '',
    paymentMethod: 'CASH_ON_PICKUP',
  })
  const [profileError, setProfileError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCustomerProfile()
      .then((profile) => setDetails((current) => ({
        ...current,
        fullName: profile.fullName || current.fullName,
        email: profile.email || current.email,
        phone: profile.phone || current.phone,
      })))
      .catch((error) => setProfileError(orderError(error)))
  }, [])

  function update(event) {
    const { name, value } = event.target
    setDetails((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!cart.length) {
      setErrorMessage('Your cart is empty. Add materials before placing an order.')
      return
    }

    setSubmitting(true)
    try {
      const order = await createCustomerOrder({
        fulfillmentType: details.fulfillmentType,
        address: details.address,
        city: details.city,
        state: details.state,
        pincode: details.pincode,
        fulfillmentAddress: details.address,
        preferredDate: details.preferredDate,
        preferredTime: details.preferredTime,
        instructions: details.instructions,
        paymentMethod: details.paymentMethod,
        items: cart.map(({ material, weight }) => ({
          productKey: material.id,
          productName: material.name,
          imageUrl: material.images[0],
          pricePerKg: material.price,
          quantityKg: weight,
        })),
      })
      onOrderPlaced()
      navigate(`/order-confirmation/${encodeURIComponent(order.orderNumber)}`, { replace: true, state: { order } })
    } catch (error) {
      setErrorMessage(orderError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="checkout-page section-wrap">
      <div className="materials-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Checkout</span></div>
      <header className="checkout-heading">
        <p className="eyebrow">YOUR ORDER</p>
        <h1>Checkout</h1>
        <p>Review your materials and choose how we can arrange collection or delivery.</p>
      </header>
      {profileError && <p className="checkout-alert" role="status">We could not load some saved account details. Please check the customer information below. ({profileError})</p>}
      {errorMessage && <p className="checkout-alert" role="alert">{errorMessage}</p>}
      {cart.length === 0 ? (
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add materials to your cart before checking out.</p>
          <Link className="button button-primary" to="/scrap-materials">Browse materials</Link>
        </div>
      ) : (
        <form className="checkout-layout" onSubmit={submit}>
          <div className="checkout-main">
            <section className="checkout-card">
              <p className="checkout-step">01 <span>Customer details</span></p>
              <div className="checkout-fields">
                <label>Customer name<input name="fullName" value={details.fullName} readOnly required /></label>
                <label>Email address<input name="email" type="email" value={details.email} readOnly required /></label>
                <label>Phone number<input name="phone" type="tel" value={details.phone} readOnly required /></label>
                <label>Address<input name="address" autoComplete="street-address" value={details.address} onChange={update} maxLength="255" required /></label>
                <label>City<input name="city" autoComplete="address-level2" value={details.city} onChange={update} maxLength="100" required /></label>
                <label>State<input name="state" autoComplete="address-level1" value={details.state} onChange={update} maxLength="100" required /></label>
                <label>Pincode<input name="pincode" inputMode="numeric" pattern="[0-9]{6}" title="Enter a 6-digit pincode" value={details.pincode} onChange={update} required /></label>
              </div>
            </section>

            <section className="checkout-card">
              <p className="checkout-step">02 <span>Pickup / delivery</span></p>
              <div className="checkout-choice-row">
                <label className={`checkout-choice${details.fulfillmentType === 'PICKUP' ? ' selected' : ''}`}>
                  <input type="radio" name="fulfillmentType" value="PICKUP" checked={details.fulfillmentType === 'PICKUP'} onChange={update} />
                  <span><strong>Pickup</strong><small>Arrange collection with our team</small></span>
                </label>
                <label className={`checkout-choice${details.fulfillmentType === 'DELIVERY' ? ' selected' : ''}`}>
                  <input type="radio" name="fulfillmentType" value="DELIVERY" checked={details.fulfillmentType === 'DELIVERY'} onChange={update} />
                  <span><strong>Delivery</strong><small>We’ll confirm delivery arrangements</small></span>
                </label>
              </div>
              <div className="checkout-fields">
                <label>Preferred date<input type="date" name="preferredDate" min={minimumCheckoutDate} value={details.preferredDate} onChange={update} required /></label>
                <label>Preferred time
                  <select name="preferredTime" value={details.preferredTime} onChange={update} required>
                    <option value="">Select a time window</option>
                    <option>9:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 3:00 PM</option>
                    <option>3:00 PM - 6:00 PM</option>
                  </select>
                </label>
              </div>
              <label className="checkout-full-field">Additional instructions<textarea name="instructions" value={details.instructions} onChange={update} maxLength="1000" rows="3" placeholder="Anything our team should know?" /></label>
            </section>

            <section className="checkout-card">
              <p className="checkout-step">03 <span>Payment method</span></p>
              <label className="checkout-choice selected">
                <input type="radio" name="paymentMethod" value="CASH_ON_PICKUP" checked readOnly />
                <span><strong>Cash on Pickup</strong><small>Payment remains pending until your order is confirmed and collected.</small></span>
              </label>
              <label className="checkout-choice checkout-choice-disabled">
                <input type="radio" name="onlinePayment" disabled />
                <span><strong>Online Payment</strong><small>Unavailable until a payment gateway is configured.</small></span>
              </label>
              <p className="checkout-weight-note">Final product weight and pricing will be confirmed by our ScrapWorld team.</p>
            </section>
          </div>

          <aside className="checkout-summary checkout-card">
            <p className="checkout-step">04 <span>Order summary</span></p>
            <div className="checkout-summary-items">
              {cart.map(({ material, weight }) => (
                <article className="checkout-summary-item" key={material.id}>
                  <img src={material.images[0]} alt={material.name} />
                  <div><strong>{material.name}</strong><span>{currency(material.price)} / kg · {weight} kg</span></div>
                  <b>{currency(material.price * weight)}</b>
                </article>
              ))}
            </div>
            <div className="checkout-summary-total"><span>Subtotal</span><strong>{currency(subtotal)}</strong></div>
            <div className="checkout-summary-total"><span>Additional charges</span><strong>{currency(0)}</strong></div>
            <div className="checkout-summary-grand"><span>Estimated amount</span><strong>{currency(subtotal)}</strong></div>
            <p className="checkout-estimate-note">This is an estimate. Final weight and pricing will be confirmed by our team.</p>
            <button className="button button-primary checkout-place-order" type="submit" disabled={submitting}>
              {submitting ? 'Placing order…' : 'Place Order'}
            </button>
            <Link className="checkout-back-link" to="/scrap-materials">Continue shopping</Link>
          </aside>
        </form>
      )}
    </section>
  )
}

function OrderStatus({ order }) {
  return (
    <div className="checkout-status-grid">
      <div><span>Payment status</span><strong>{order.paymentStatus}</strong></div>
      <div><span>Order status</span><strong>{order.status}</strong></div>
    </div>
  )
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (order) return
    getCustomerOrder(orderNumber)
      .then(setOrder)
      .catch((error) => setErrorMessage(orderError(error)))
  }, [order, orderNumber])

  if (errorMessage) return <section className="checkout-page section-wrap"><p className="checkout-alert" role="alert">{errorMessage}</p><Link to="/my-orders">View My Orders</Link></section>
  if (!order) return <section className="checkout-page section-wrap"><p>Loading order confirmation…</p></section>

  const totalQuantity = order.items.reduce((total, item) => total + Number(item.quantityKg), 0)
  return (
    <section className="checkout-page section-wrap">
      <div className="order-confirmation-card">
        <span className="order-success-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">THANK YOU</p>
        <h1>Order Successfully Placed</h1>
        <p>Your order has been recorded. Our team will confirm the final weight and pricing with you.</p>
        <div className="order-confirmation-id"><span>Order ID</span><strong>{order.orderNumber}</strong></div>
        <div className="checkout-summary-items">
          {order.items.map((item) => (
            <article className="checkout-summary-item" key={item.id}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.productName} />}
              <div><strong>{item.productName}</strong><span>{currency(item.pricePerKg)} / kg · {item.quantityKg} kg</span></div>
              <b>{currency(item.estimatedTotal)}</b>
            </article>
          ))}
        </div>
        <div className="order-confirmation-amount">
          <span>Total quantity <strong>{totalQuantity.toLocaleString('en-IN')} kg</strong></span>
          <span>Estimated amount <strong>{currency(order.estimatedAmount)}</strong></span>
        </div>
        <OrderStatus order={order} />
        <div className="order-confirmation-actions">
          <Link className="button button-primary" to="/scrap-materials">Continue Shopping</Link>
          <Link className="button button-outline" to="/my-orders">View My Orders</Link>
        </div>
      </div>
    </section>
  )
}

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    getCustomerOrders()
      .then(setOrders)
      .catch((error) => setErrorMessage(orderError(error)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="checkout-page section-wrap">
      <div className="materials-breadcrumb"><Link to="/">Home</Link><span>/</span><span>My orders</span></div>
      <header className="checkout-heading"><p className="eyebrow">YOUR ACCOUNT</p><h1>My Orders</h1></header>
      {errorMessage && <p className="checkout-alert" role="alert">{errorMessage}</p>}
      {loading ? <p>Loading your orders…</p> : orders.length === 0 ? (
        <div className="checkout-empty"><h2>No orders yet</h2><p>Your ScrapWorld orders will appear here.</p><Link className="button button-primary" to="/scrap-materials">Browse materials</Link></div>
      ) : (
        <div className="customer-orders-list">
          {orders.map((order) => (
            <article className="customer-order-card" key={order.orderNumber}>
              <div className="customer-order-heading"><div><span>Order ID</span><strong>{order.orderNumber}</strong></div><OrderStatus order={order} /></div>
              <div className="checkout-summary-items">
                {order.items.map((item) => <article className="checkout-summary-item" key={item.id}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.productName} />}
                  <div><strong>{item.productName}</strong><span>{item.quantityKg} kg · {currency(item.pricePerKg)} / kg</span></div>
                  <b>{currency(item.estimatedTotal)}</b>
                </article>)}
              </div>
              <div className="customer-order-footer"><span>{order.fulfillmentType} · {order.preferredDate}</span><strong>Estimated {currency(order.estimatedAmount)}</strong></div>
              <Link className="text-link" to={`/order-confirmation/${encodeURIComponent(order.orderNumber)}`}>View order details</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
