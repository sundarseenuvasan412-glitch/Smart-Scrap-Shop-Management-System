import { useMemo, useState } from 'react'

const STORAGE_KEY = 'scrapworld-admin-workspace-v1'
const defaultCategoryNames = [
  'Waste Paper',
  'Plastic',
  'Iron',
  'Copper',
  'Aluminium',
  'Cardboard',
  'Glass',
  'E-Waste',
]
const orderStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const pageSize = 7

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultWorkspace() {
  return {
    products: [],
    categories: defaultCategoryNames.map((name) => ({
      id: createId(),
      name,
      description: '',
      image: '',
      status: 'Active',
    })),
    orders: [],
    customers: [],
    stockHistory: [],
  }
}

function readWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { data: createDefaultWorkspace(), error: '' }
    const data = JSON.parse(saved)
    const valid = ['products', 'categories', 'orders', 'customers', 'stockHistory']
      .every((key) => Array.isArray(data[key]))
    if (!valid) throw new Error('Stored workspace has an invalid shape.')
    return { data, error: '' }
  } catch {
    return {
      data: createDefaultWorkspace(),
      error: 'Could not read the saved workspace. Existing browser data was left untouched.',
    }
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value))
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

function Field({ label, children, className = '' }) {
  return <label className={`admin-form-field ${className}`}>{label}{children}</label>
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className={`admin-modal${wide ? ' admin-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <div className="admin-modal-heading">
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}

function EmptyState({ title, description, onAdd, addLabel }) {
  return (
    <div className="admin-management-empty">
      <span className="admin-management-empty-icon" aria-hidden="true">⌁</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {onAdd && <button className="admin-button admin-button-primary" type="button" onClick={onAdd}>＋ {addLabel}</button>}
    </div>
  )
}

function StatusBadge({ children }) {
  const className = String(children).toLowerCase().replace(/\s+/g, '-')
  return <span className={`admin-status-badge status-${className}`}>{children}</span>
}

function TablePagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  return (
    <div className="admin-pagination">
      <span>Page {page} of {pageCount}</span>
      <div>
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  )
}

export default function AdminManagement({ section }) {
  const [workspace, setWorkspace] = useState(readWorkspace)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [notice, setNotice] = useState('')
  const [imageError, setImageError] = useState('')
  const { data } = workspace

  function updateWorkspace(update) {
    if (workspace.error) return
    const next = typeof update === 'function' ? update(data) : update
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setWorkspace({ data: next, error: '' })
      setNotice('Changes saved in this browser.')
    } catch (error) {
      setNotice('')
      setImageError(error?.name === 'QuotaExceededError'
        ? 'Browser storage is full. Remove large images and try again.'
        : 'Could not save your changes in this browser.')
    }
  }

  function openCreate(type = section, item = null) {
    setNotice('')
    setImageError('')
    setModal({ type, item })
  }

  function removeRecord(key, id, label) {
    if (key === 'categories' && data.products.some((product) => product.category === data.categories.find((category) => category.id === id)?.name)) {
      setImageError('This category is assigned to products. Reassign or delete those products before removing it.')
      return
    }
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return
    updateWorkspace((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }))
    setDetail(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form.entries())
    const existing = modal.item
    const id = existing?.id || createId()

    try {
      if (modal.type === 'products') {
        const selectedImages = Array.from(form.getAll('images')).filter((file) => file instanceof File && file.size > 0)
        const images = selectedImages.length
          ? await Promise.all(selectedImages.map(readImage))
          : existing?.images || []
        const product = {
          ...existing,
          id,
          name: values.name.trim(),
          description: values.description.trim(),
          category: values.category,
          price: Number(values.price),
          unit: values.unit,
          quantity: Number(values.quantity),
          sold: existing?.sold || 0,
          minimumStock: Number(values.minimumStock),
          status: values.status,
          images,
        }
        updateWorkspace((current) => ({
          ...current,
          products: existing
            ? current.products.map((item) => item.id === id ? product : item)
            : [product, ...current.products],
        }))
      } else if (modal.type === 'categories') {
        const imageFile = form.get('image')
        const image = imageFile instanceof File && imageFile.size > 0
          ? await readImage(imageFile)
          : existing?.image || ''
        const category = {
          ...existing,
          id,
          name: values.name.trim(),
          description: values.description.trim(),
          image,
          status: values.status,
        }
        updateWorkspace((current) => ({
          ...current,
          categories: existing
            ? current.categories.map((item) => item.id === id ? category : item)
            : [category, ...current.categories],
        }))
      } else if (modal.type === 'orders') {
        const order = {
          ...existing,
          id,
          orderId: existing?.orderId || `SW-${Date.now().toString().slice(-7)}`,
          customerName: values.customerName.trim(),
          customerEmail: values.customerEmail.trim(),
          product: values.product.trim(),
          quantity: Number(values.quantity),
          total: Number(values.total),
          paymentMethod: values.paymentMethod,
          paymentStatus: values.paymentStatus,
          status: existing?.status || 'Pending',
          address: values.address.trim(),
          date: existing?.date || new Date().toISOString(),
        }
        updateWorkspace((current) => ({
          ...current,
          orders: existing
            ? current.orders.map((item) => item.id === id ? order : item)
            : [order, ...current.orders],
        }))
      } else if (modal.type === 'customers') {
        const customer = {
          ...existing,
          id,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
          registered: existing?.registered || new Date().toISOString(),
          blocked: existing?.blocked || false,
        }
        updateWorkspace((current) => ({
          ...current,
          customers: existing
            ? current.customers.map((item) => item.id === id ? customer : item)
            : [customer, ...current.customers],
        }))
      } else if (modal.type === 'stock') {
        const product = data.products.find((item) => item.id === values.productId)
        const quantity = Number(values.quantity)
        const isStockIn = values.direction === 'in'
        if (!product || !Number.isFinite(quantity) || quantity <= 0) {
          setImageError('Choose a product and enter a quantity greater than zero.')
          return
        }
        if (!isStockIn && quantity > product.quantity) {
          setImageError(`Only ${product.quantity} ${product.unit} is currently available.`)
          return
        }
        const changedProduct = {
          ...product,
          quantity: product.quantity + (isStockIn ? quantity : -quantity),
          sold: product.sold + (!isStockIn && values.reason === 'Sale' ? quantity : 0),
        }
        const historyItem = {
          id: createId(),
          productId: product.id,
          productName: product.name,
          direction: values.direction,
          quantity,
          unit: product.unit,
          reason: values.reason,
          date: new Date().toISOString(),
        }
        updateWorkspace((current) => ({
          ...current,
          products: current.products.map((item) => item.id === product.id ? changedProduct : item),
          stockHistory: [historyItem, ...current.stockHistory],
        }))
      }
      setModal(null)
    } catch (error) {
      setImageError(error.message || 'Could not read the selected image.')
    }
  }

  function changeOrderStatus(order, status) {
    updateWorkspace((current) => ({
      ...current,
      orders: current.orders.map((item) => item.id === order.id ? { ...item, status } : item),
    }))
  }

  function toggleCustomer(customer) {
    updateWorkspace((current) => ({
      ...current,
      customers: current.customers.map((item) => item.id === customer.id
        ? { ...item, blocked: !item.blocked }
        : item),
    }))
  }

  function getPage(items) {
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
    const currentPage = Math.min(page, pageCount)
    return {
      items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
      pageCount,
      currentPage,
    }
  }

  const pageHeading = {
    products: ['CATALOGUE', 'Products', 'Manage your scrap materials, pricing and availability.'],
    categories: ['CATALOGUE', 'Categories', 'Organise the materials listed in your catalogue.'],
    inventory: ['STOCK CONTROL', 'Inventory', 'Monitor stock levels and record every movement.'],
    orders: ['SALES', 'Orders', 'Review orders and keep their fulfilment status up to date.'],
    customers: ['RELATIONSHIPS', 'Customers', 'Review customer profiles and their purchase history.'],
  }[section]

  const headingAction = section === 'inventory'
    ? ['＋ Stock movement', () => openCreate('stock')]
    : section === 'products'
      ? ['＋ Add product', () => openCreate('products')]
      : section === 'categories'
        ? ['＋ Add category', () => openCreate('categories')]
        : section === 'orders'
          ? ['＋ Add order', () => openCreate('orders')]
          : ['＋ Add customer', () => openCreate('customers')]

  return (
    <section className="admin-management" aria-labelledby="management-title">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">{pageHeading[0]}</p>
          <h1 id="management-title">{pageHeading[1]}</h1>
          <p>{pageHeading[2]}</p>
        </div>
        <div className="admin-management-heading-actions">
          <span className="admin-local-badge"><span /> Local workspace</span>
          <button className="admin-button admin-button-primary" type="button" onClick={headingAction[1]}>{headingAction[0]}</button>
        </div>
      </div>
      {workspace.error && <p className="admin-alert" role="alert">{workspace.error}</p>}
      {imageError && <p className="admin-alert" role="alert">{imageError}</p>}
      {notice && <p className="admin-management-notice" role="status">{notice}</p>}

      {section === 'products' && <ProductsPage {...{ data, query, setQuery, filter, setFilter, page, setPage, getPage, openCreate, setDetail, removeRecord }} />}
      {section === 'categories' && <CategoriesPage {...{ data, query, setQuery, filter, setFilter, page, setPage, getPage, openCreate, setDetail, removeRecord }} />}
      {section === 'inventory' && <InventoryPage {...{ data, query, setQuery, filter, setFilter, page, setPage, getPage, openCreate, setDetail }} />}
      {section === 'orders' && <OrdersPage {...{ data, query, setQuery, filter, setFilter, page, setPage, getPage, setDetail, changeOrderStatus }} />}
      {section === 'customers' && <CustomersPage {...{ data, query, setQuery, filter, setFilter, page, setPage, getPage, setDetail, toggleCustomer }} />}

      {modal && (
        <Modal
          title={modal.item ? `Edit ${modal.type === 'products' ? 'product' : modal.type === 'categories' ? 'category' : modal.type === 'customers' ? 'customer' : 'order'}` : modal.type === 'stock' ? 'Record stock movement' : `Add ${modal.type === 'products' ? 'product' : modal.type === 'categories' ? 'category' : modal.type === 'customers' ? 'customer' : 'order'}`}
          onClose={() => setModal(null)}
          wide={modal.type === 'products' || modal.type === 'orders'}
        >
          <form className="admin-management-form" onSubmit={handleSubmit}>
            {modal.type === 'products' && <ProductForm item={modal.item} categories={data.categories} />}
            {modal.type === 'categories' && <CategoryForm item={modal.item} />}
            {modal.type === 'stock' && <StockForm products={data.products} />}
            {modal.type === 'orders' && <OrderForm item={modal.item} />}
            {modal.type === 'customers' && <CustomerForm item={modal.item} />}
            <div className="admin-form-actions">
              <button type="button" className="admin-button admin-button-quiet" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="admin-button admin-button-primary" disabled={Boolean(workspace.error) || (modal.type === 'stock' && data.products.length === 0)}>{modal.type === 'stock' ? 'Save movement' : modal.item ? 'Save changes' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
      {detail && (
        <DetailsModal
          section={section}
          item={detail}
          data={data}
          onClose={() => setDetail(null)}
          onEdit={() => { setModal({ type: section, item: detail }); setDetail(null) }}
          onDelete={() => removeRecord(section, detail.id, section.slice(0, -1))}
          onCancelOrder={() => { changeOrderStatus(detail, 'Cancelled'); setDetail(null) }}
          onCustomerOrders={(customer) => setDetail({ ...customer, showOrders: true })}
          onCustomerEdit={() => { setModal({ type: 'customers', item: detail }); setDetail(null) }}
        />
      )}
    </section>
  )
}

function SearchAndFilter({ query, setQuery, filter, setFilter, options, placeholder = 'Search...' }) {
  return (
    <div className="admin-management-toolbar">
      <label className="admin-search-field">
        <span aria-hidden="true">⌕</span>
        <input aria-label={placeholder} placeholder={placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {options && <select aria-label="Filter records" value={filter} onChange={(event) => setFilter(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>}
    </div>
  )
}

function ProductsPage({ data, query, setQuery, filter, setFilter, setPage, getPage, openCreate, setDetail, removeRecord }) {
  const filtered = useMemo(() => data.products.filter((item) => {
    const searchable = `${item.name} ${item.category} ${item.description}`.toLowerCase()
    return searchable.includes(query.trim().toLowerCase()) && (filter === 'All' || item.status === filter)
  }), [data.products, query, filter])
  const pagination = getPage(filtered)
  return (
    <>
      <div className="admin-management-stats">
        <Metric label="Total products" value={data.products.length} icon="◇" />
        <Metric label="Active listings" value={data.products.filter((item) => item.status === 'Active').length} icon="✓" />
        <Metric label="Low stock" value={data.products.filter((item) => item.quantity > 0 && item.quantity <= item.minimumStock).length} icon="!" />
        <Metric label="Out of stock" value={data.products.filter((item) => item.quantity <= 0).length} icon="∅" />
      </div>
      <div className="admin-panel admin-management-panel">
        <SearchAndFilter {...{ query, setQuery, filter, setFilter }} options={['All', 'Active', 'Inactive']} placeholder="Search products..." />
        {filtered.length === 0 ? <EmptyState title={query ? 'No matching products' : 'Your catalogue is ready'} description={query ? 'Try another search or clear the selected filter.' : 'Add your first product to start managing prices and stock.'} onAdd={() => openCreate('products')} addLabel="Add product" /> : (
          <div className="admin-table-wrap">
            <table className="admin-management-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price / unit</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{pagination.items.map((item) => (
                <tr key={item.id}>
                  <td><div className="admin-product-cell">{item.images?.[0] ? <img src={item.images[0]} alt="" /> : <span className="admin-product-placeholder">◇</span>}<div><strong>{item.name}</strong><small>{item.description || 'No description'}</small></div></div></td>
                  <td>{item.category}</td><td>{formatCurrency(item.price)} / {item.unit}</td>
                  <td>{item.quantity.toLocaleString('en-IN')} {item.unit}</td><td><StatusBadge>{item.status}</StatusBadge></td>
                  <td><RowActions onView={() => setDetail(item)} onEdit={() => openCreate('products', item)} onDelete={() => removeRecord('products', item.id, 'product')} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <TablePagination {...pagination} onChange={setPage} />
      </div>
    </>
  )
}

function CategoriesPage({ data, query, setQuery, filter, setFilter, setPage, getPage, openCreate, setDetail, removeRecord }) {
  const filtered = useMemo(() => data.categories.filter((item) => (
    `${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())
    && (filter === 'All' || item.status === filter)
  )), [data.categories, query, filter])
  const pagination = getPage(filtered)
  return (
    <>
      <div className="admin-management-stats">
        <Metric label="Total categories" value={data.categories.length} icon="◫" />
        <Metric label="Active categories" value={data.categories.filter((item) => item.status === 'Active').length} icon="✓" />
        <Metric label="Products assigned" value={data.products.filter((item) => item.category).length} icon="◇" />
        <Metric label="Unassigned products" value={data.products.filter((item) => !data.categories.some((category) => category.name === item.category)).length} icon="!" />
      </div>
      <div className="admin-panel admin-management-panel">
        <SearchAndFilter {...{ query, setQuery, filter, setFilter }} options={['All', 'Active', 'Inactive']} placeholder="Search categories..." />
        {filtered.length === 0 ? <EmptyState title="No categories found" description="Try a different search, or add a new category." onAdd={() => openCreate('categories')} addLabel="Add category" /> : (
          <div className="admin-table-wrap">
            <table className="admin-management-table">
              <thead><tr><th>Category</th><th>Description</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{pagination.items.map((item) => (
                <tr key={item.id}>
                  <td><div className="admin-product-cell">{item.image ? <img src={item.image} alt="" /> : <span className="admin-product-placeholder">◫</span>}<strong>{item.name}</strong></div></td>
                  <td>{item.description || '—'}</td>
                  <td>{data.products.filter((product) => product.category === item.name).length}</td>
                  <td><StatusBadge>{item.status}</StatusBadge></td>
                  <td><RowActions onView={() => setDetail(item)} onEdit={() => openCreate('categories', item)} onDelete={() => removeRecord('categories', item.id, 'category')} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <TablePagination {...pagination} onChange={setPage} />
      </div>
    </>
  )
}

function InventoryPage({ data, query, setQuery, filter, setFilter, setPage, getPage, openCreate, setDetail }) {
  const total = data.products.reduce((sum, item) => sum + item.quantity + item.sold, 0)
  const available = data.products.reduce((sum, item) => sum + item.quantity, 0)
  const sold = data.products.reduce((sum, item) => sum + item.sold, 0)
  const low = data.products.filter((item) => item.quantity > 0 && item.quantity <= item.minimumStock)
  const filtered = data.products.filter((item) => {
    const searchable = `${item.name} ${item.category}`.toLowerCase()
    const stockFilter = filter === 'All' || (filter === 'Low stock' && item.quantity > 0 && item.quantity <= item.minimumStock)
      || (filter === 'Out of stock' && item.quantity <= 0)
      || (filter === 'In stock' && item.quantity > item.minimumStock)
    return searchable.includes(query.trim().toLowerCase()) && stockFilter
  })
  const pagination = getPage(filtered)
  return (
    <>
      {low.length > 0 && <div className="admin-stock-warning" role="status"><span>!</span><div><strong>Low stock warning</strong><p>{low.map((item) => item.name).join(', ')} {low.length === 1 ? 'is' : 'are'} at or below minimum stock.</p></div></div>}
      <div className="admin-management-stats">
        <Metric label="Total stock" value={total.toLocaleString('en-IN')} icon="▤" />
        <Metric label="Available stock" value={available.toLocaleString('en-IN')} icon="✓" />
        <Metric label="Sold stock" value={sold.toLocaleString('en-IN')} icon="⇄" />
        <Metric label="Low / out of stock" value={`${low.length} / ${data.products.filter((item) => item.quantity <= 0).length}`} icon="!" />
      </div>
      <div className="admin-panel admin-management-panel">
        <div className="admin-management-subheading"><div><h2>Product stock</h2><p>Current quantity and minimum stock threshold</p></div><button type="button" className="admin-button admin-button-outline" onClick={() => openCreate('stock')}>＋ Stock in / out</button></div>
        <SearchAndFilter {...{ query, setQuery, filter, setFilter }} options={['All', 'In stock', 'Low stock', 'Out of stock']} placeholder="Search inventory..." />
        {filtered.length === 0 ? <EmptyState title={data.products.length ? 'No matching stock records' : 'Inventory is empty'} description={data.products.length ? 'Change your search or inventory filter.' : 'Add products to the catalogue to start tracking stock.'} /> : (
          <div className="admin-table-wrap">
            <table className="admin-management-table">
              <thead><tr><th>Product</th><th>Category</th><th>Available</th><th>Sold</th><th>Minimum</th><th>Stock level</th><th>Action</th></tr></thead>
              <tbody>{pagination.items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td><td>{item.category}</td>
                  <td>{item.quantity.toLocaleString('en-IN')} {item.unit}</td><td>{item.sold.toLocaleString('en-IN')} {item.unit}</td>
                  <td>{item.minimumStock.toLocaleString('en-IN')} {item.unit}</td>
                  <td><StatusBadge>{item.quantity <= 0 ? 'Out of stock' : item.quantity <= item.minimumStock ? 'Low stock' : 'In stock'}</StatusBadge></td>
                  <td><button className="admin-text-button" type="button" onClick={() => setDetail(item)}>History</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <TablePagination {...pagination} onChange={setPage} />
      </div>
      <section className="admin-panel admin-management-panel admin-history-panel">
        <div className="admin-management-subheading"><div><h2>Stock history</h2><p>Recent stock in and stock out activity</p></div></div>
        {data.stockHistory.length === 0 ? <p className="admin-history-empty">Stock movements will appear here when recorded.</p> : (
          <div className="admin-table-wrap"><table className="admin-management-table">
            <thead><tr><th>Product</th><th>Movement</th><th>Quantity</th><th>Reason</th><th>Date</th></tr></thead>
            <tbody>{data.stockHistory.slice(0, 7).map((item) => <tr key={item.id}><td>{item.productName}</td><td><StatusBadge>{item.direction === 'in' ? 'Stock in' : 'Stock out'}</StatusBadge></td><td>{item.quantity.toLocaleString('en-IN')} {item.unit}</td><td>{item.reason}</td><td>{formatDate(item.date)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </>
  )
}

function OrdersPage({ data, query, setQuery, filter, setFilter, setPage, getPage, setDetail, changeOrderStatus }) {
  const filtered = data.orders.filter((item) => (
    `${item.orderId} ${item.customerName} ${item.product}`.toLowerCase().includes(query.trim().toLowerCase())
    && (filter === 'All' || item.status === filter)
  ))
  const pagination = getPage(filtered)
  return (
    <div className="admin-panel admin-management-panel">
      <SearchAndFilter {...{ query, setQuery, filter, setFilter }} options={['All', ...orderStatuses]} placeholder="Search orders..." />
      {filtered.length === 0 ? <EmptyState title={query ? 'No matching orders' : 'No orders to show yet'} description={query ? 'Try searching by order ID, customer or product.' : 'Newly recorded orders will appear here.'} /> : (
        <div className="admin-table-wrap"><table className="admin-management-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Product / qty</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{pagination.items.map((item) => <tr key={item.id}>
            <td><strong>{item.orderId}</strong></td><td>{item.customerName}</td>
            <td>{item.product}<small className="admin-table-secondary">{item.quantity} unit(s)</small></td>
            <td>{formatCurrency(item.total)}</td><td><span>{item.paymentMethod}</span><small className="admin-table-secondary">{item.paymentStatus}</small></td>
            <td>{formatDate(item.date)}</td>
            <td><select className="admin-inline-select" aria-label={`Update status for ${item.orderId}`} value={item.status} onChange={(event) => changeOrderStatus(item, event.target.value)}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></td>
            <td><button className="admin-text-button" type="button" onClick={() => setDetail(item)}>Details</button></td>
          </tr>)}</tbody>
        </table></div>
      )}
      <TablePagination {...pagination} onChange={setPage} />
    </div>
  )
}

function CustomersPage({ data, query, setQuery, filter, setFilter, setPage, getPage, setDetail, toggleCustomer }) {
  const filtered = data.customers.filter((item) => {
    return `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.trim().toLowerCase())
      && (filter === 'All' || (filter === 'Blocked' ? item.blocked : !item.blocked))
  })
  const pagination = getPage(filtered)
  return (
    <div className="admin-panel admin-management-panel">
      <SearchAndFilter {...{ query, setQuery, filter, setFilter }} options={['All', 'Active', 'Blocked']} placeholder="Search customers..." />
      {filtered.length === 0 ? <EmptyState title={query ? 'No matching customers' : 'No customers to show yet'} description={query ? 'Try a name, email or phone number.' : 'Customers added to this local workspace will appear here.'} /> : (
        <div className="admin-table-wrap"><table className="admin-management-table">
          <thead><tr><th>Customer</th><th>Contact</th><th>Registered</th><th>Orders</th><th>Total purchase</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{pagination.items.map((item) => {
            const orders = data.orders.filter((order) => order.customerEmail.toLowerCase() === item.email.toLowerCase())
            const purchaseTotal = orders.reduce((sum, order) => sum + order.total, 0)
            return <tr key={item.id}>
              <td><div className="admin-customer-cell"><span>{item.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><strong>{item.name}</strong></div></td>
              <td>{item.email}<small className="admin-table-secondary">{item.phone || 'No phone number'}</small></td>
              <td>{formatDate(item.registered)}</td><td>{orders.length}</td><td>{formatCurrency(purchaseTotal)}</td>
              <td><StatusBadge>{item.blocked ? 'Blocked' : 'Active'}</StatusBadge></td>
              <td><div className="admin-row-actions"><button className="admin-text-button" type="button" onClick={() => setDetail(item)}>View</button><button className="admin-text-button" type="button" onClick={() => toggleCustomer(item)}>{item.blocked ? 'Unblock' : 'Block'}</button></div></td>
            </tr>
          })}</tbody>
        </table></div>
      )}
      <TablePagination {...pagination} onChange={setPage} />
    </div>
  )
}

function Metric({ label, value, icon }) {
  return <article className="admin-metric-card"><div className="admin-metric-top"><span>{label}</span><span className="admin-metric-icon" aria-hidden="true">{icon}</span></div><strong className="admin-metric-value">{value}</strong></article>
}

function RowActions({ onView, onEdit, onDelete }) {
  return <div className="admin-row-actions"><button className="admin-text-button" type="button" onClick={onView}>View</button><button className="admin-text-button" type="button" onClick={onEdit}>Edit</button><button className="admin-text-button admin-text-danger" type="button" onClick={onDelete}>Delete</button></div>
}

function ProductForm({ item, categories }) {
  return (
    <div className="admin-form-grid">
      <Field label="Product name"><input name="name" required maxLength="150" defaultValue={item?.name || ''} /></Field>
      <Field label="Category"><select name="category" required defaultValue={item?.category || ''}><option value="" disabled>Select category</option>{categories.filter((category) => category.status === 'Active').map((category) => <option key={category.id}>{category.name}</option>)}</select></Field>
      <Field label="Price"><input name="price" type="number" min="0.01" step="0.01" required defaultValue={item?.price ?? ''} /></Field>
      <Field label="Price unit"><select name="unit" defaultValue={item?.unit || 'kg'}><option value="kg">Per kg</option><option value="unit">Per unit</option></select></Field>
      <Field label="Available quantity"><input name="quantity" type="number" min="0" step="0.01" required defaultValue={item?.quantity ?? 0} /></Field>
      <Field label="Minimum stock"><input name="minimumStock" type="number" min="0" step="0.01" required defaultValue={item?.minimumStock ?? 0} /></Field>
      <Field label="Status"><select name="status" defaultValue={item?.status || 'Active'}><option>Active</option><option>Inactive</option></select></Field>
      <Field label="Product images (multiple)" className="admin-form-span"><input name="images" type="file" accept="image/*" multiple /><small>{item?.images?.length ? `${item.images.length} image(s) saved. Upload to replace.` : 'Choose one or more images.'}</small></Field>
      <Field label="Description" className="admin-form-span"><textarea name="description" rows="3" maxLength="2000" defaultValue={item?.description || ''} /></Field>
    </div>
  )
}

function CategoryForm({ item }) {
  return (
    <div className="admin-form-grid">
      <Field label="Category name"><input name="name" required maxLength="100" defaultValue={item?.name || ''} /></Field>
      <Field label="Status"><select name="status" defaultValue={item?.status || 'Active'}><option>Active</option><option>Inactive</option></select></Field>
      <Field label="Category image"><input name="image" type="file" accept="image/*" /><small>{item?.image ? 'An image is saved. Upload to replace.' : 'Choose an image (optional).'}</small></Field>
      <Field label="Description" className="admin-form-span"><textarea name="description" rows="3" maxLength="1000" defaultValue={item?.description || ''} /></Field>
    </div>
  )
}

function StockForm({ products }) {
  return products.length === 0 ? <p className="admin-form-help">Create a product before recording a stock movement.</p> : (
    <div className="admin-form-grid">
      <Field label="Product"><select name="productId" required defaultValue=""><option value="" disabled>Select product</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.quantity} {product.unit}</option>)}</select></Field>
      <Field label="Movement"><select name="direction" defaultValue="in"><option value="in">Stock in</option><option value="out">Stock out</option></select></Field>
      <Field label="Quantity"><input name="quantity" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Reason"><select name="reason" defaultValue="Purchase"><option>Purchase</option><option>Sale</option><option>Return</option><option>Adjustment</option><option>Damaged</option></select></Field>
    </div>
  )
}

function OrderForm({ item }) {
  return (
    <div className="admin-form-grid">
      <Field label="Customer name"><input name="customerName" required defaultValue={item?.customerName || ''} /></Field>
      <Field label="Customer email"><input name="customerEmail" type="email" required defaultValue={item?.customerEmail || ''} /></Field>
      <Field label="Product details"><input name="product" required defaultValue={item?.product || ''} /></Field>
      <Field label="Order quantity"><input name="quantity" type="number" min="0.01" step="0.01" required defaultValue={item?.quantity ?? ''} /></Field>
      <Field label="Total price (INR)"><input name="total" type="number" min="0" step="0.01" required defaultValue={item?.total ?? ''} /></Field>
      <Field label="Payment method"><select name="paymentMethod" defaultValue={item?.paymentMethod || 'Bank transfer'}><option>Bank transfer</option><option>Cash</option><option>UPI</option><option>Card</option><option>Other</option></select></Field>
      <Field label="Payment status"><select name="paymentStatus" defaultValue={item?.paymentStatus || 'Pending'}><option>Pending</option><option>Paid</option><option>Failed</option><option>Refunded</option></select></Field>
      <Field label="Delivery address" className="admin-form-span"><textarea name="address" rows="2" required defaultValue={item?.address || ''} /></Field>
    </div>
  )
}

function CustomerForm({ item }) {
  return (
    <div className="admin-form-grid">
      <Field label="Customer name"><input name="name" required maxLength="100" defaultValue={item?.name || ''} /></Field>
      <Field label="Email address"><input name="email" type="email" required maxLength="150" defaultValue={item?.email || ''} /></Field>
      <Field label="Phone number"><input name="phone" type="tel" maxLength="20" defaultValue={item?.phone || ''} /></Field>
      <Field label="Address" className="admin-form-span"><textarea name="address" rows="3" defaultValue={item?.address || ''} /></Field>
    </div>
  )
}

function DetailsModal({ section, item, data, onClose, onEdit, onDelete, onCancelOrder, onCustomerOrders, onCustomerEdit }) {
  if (section === 'customers') {
    const customerOrders = data.orders.filter((order) => order.customerEmail.toLowerCase() === item.email.toLowerCase())
    return (
      <Modal title={item.showOrders ? `${item.name} · purchase history` : 'Customer profile'} onClose={onClose} wide>
        {item.showOrders ? customerOrders.length === 0 ? <p className="admin-form-help">No purchases are recorded for this customer.</p> : <div className="admin-table-wrap"><table className="admin-management-table"><thead><tr><th>Order</th><th>Product</th><th>Quantity</th><th>Total</th><th>Status</th></tr></thead><tbody>{customerOrders.map((order) => <tr key={order.id}><td>{order.orderId}</td><td>{order.product}</td><td>{order.quantity}</td><td>{formatCurrency(order.total)}</td><td><StatusBadge>{order.status}</StatusBadge></td></tr>)}</tbody></table></div> : (
          <>
            <DetailList rows={[
              ['Name', item.name], ['Email', item.email], ['Phone', item.phone || '—'],
              ['Address', item.address || '—'], ['Registered', formatDate(item.registered)],
              ['Orders', customerOrders.length], ['Total purchase', formatCurrency(customerOrders.reduce((sum, order) => sum + order.total, 0))],
            ]} />
            <div className="admin-form-actions"><button className="admin-button admin-button-outline" type="button" onClick={() => onCustomerOrders(item)}>Purchase history</button><button className="admin-button admin-button-primary" type="button" onClick={onCustomerEdit}>Edit profile</button></div>
          </>
        )}
      </Modal>
    )
  }
  if (section === 'inventory') {
    const movements = data.stockHistory.filter((entry) => entry.productId === item.id)
    return <Modal title={`${item.name} · stock history`} onClose={onClose} wide>
      <DetailList rows={ [['Available', `${item.quantity} ${item.unit}`], ['Sold', `${item.sold} ${item.unit}`], ['Minimum stock', `${item.minimumStock} ${item.unit}`]] } />
      {movements.length === 0 ? <p className="admin-form-help">No stock movements recorded for this product.</p> : <div className="admin-table-wrap"><table className="admin-management-table"><thead><tr><th>Movement</th><th>Quantity</th><th>Reason</th><th>Date</th></tr></thead><tbody>{movements.map((entry) => <tr key={entry.id}><td>{entry.direction === 'in' ? 'Stock in' : 'Stock out'}</td><td>{entry.quantity} {item.unit}</td><td>{entry.reason}</td><td>{formatDate(entry.date)}</td></tr>)}</tbody></table></div>}
    </Modal>
  }
  if (section === 'orders') {
    return <Modal title={`Order ${item.orderId}`} onClose={onClose}>
      <DetailList rows={[
        ['Customer', item.customerName], ['Email', item.customerEmail], ['Product', item.product],
        ['Quantity', item.quantity], ['Total', formatCurrency(item.total)], ['Payment', `${item.paymentMethod} · ${item.paymentStatus}`],
        ['Order date', formatDate(item.date)], ['Status', item.status], ['Delivery address', item.address],
      ]} />
      {item.status !== 'Cancelled' && <div className="admin-form-actions"><button className="admin-button admin-button-danger" type="button" onClick={onCancelOrder}>Cancel order</button></div>}
    </Modal>
  }
  if (section === 'categories') {
    return <Modal title={item.name} onClose={onClose}>
      {item.image && <img className="admin-detail-image" src={item.image} alt={item.name} />}
      <DetailList rows={[
        ['Description', item.description || '—'], ['Status', item.status],
        ['Products', data.products.filter((product) => product.category === item.name).length],
      ]} />
      <div className="admin-form-actions"><button className="admin-button admin-button-outline" type="button" onClick={onEdit}>Edit category</button><button className="admin-button admin-button-danger" type="button" onClick={onDelete}>Delete</button></div>
    </Modal>
  }
  return <Modal title={item.name} onClose={onClose}>
    {item.images?.length > 0 && <div className="admin-detail-gallery">{item.images.map((image, index) => <img src={image} alt={`${item.name} ${index + 1}`} key={`${index}-${image.slice(0, 24)}`} />)}</div>}
    <DetailList rows={[
      ['Description', item.description || '—'], ['Category', item.category],
      ['Price', `${formatCurrency(item.price)} / ${item.unit}`], ['Available', `${item.quantity} ${item.unit}`],
      ['Minimum stock', `${item.minimumStock} ${item.unit}`], ['Sold', `${item.sold} ${item.unit}`], ['Status', item.status],
    ]} />
    <div className="admin-form-actions"><button className="admin-button admin-button-outline" type="button" onClick={onEdit}>Edit product</button><button className="admin-button admin-button-danger" type="button" onClick={onDelete}>Delete</button></div>
  </Modal>
}

function DetailList({ rows }) {
  return <dl className="admin-detail-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}
