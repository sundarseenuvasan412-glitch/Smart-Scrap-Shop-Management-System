import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import { ForgotPassword, ResetPassword } from './pages/PasswordRecovery'
import { Account } from './pages/Account'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import AdminManagement from './admin/AdminManagement'
import AdminLayout from './admin/AdminLayout'
import AdminOrders from './admin/AdminOrders'
import { CheckoutPage, CustomerOrdersPage, OrderConfirmationPage } from './pages/Checkout'
import './App.css'

const currentYear = new Date().getFullYear()
const publicPaths = new Set(['/', '/login', '/register', '/forgot-password', '/reset-password'])

const materials = [
  {
    id: 'iron',
    name: 'Iron Scrap',
    category: 'Ferrous metals',
    price: 30,
    stock: 2400,
    grade: 'Heavy melting steel',
    description:
      'Sorted, clean iron offcuts ready for a second life. Ideal for foundries, fabricators and bulk recycling.',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7L-MynFSbSLoKTg1ct1mJ1dm5KEG_aRqqRcS6Sc4JJw&s=10',
    ],
  },
  {
    id: 'plastic',
    name: 'Plastic Scrap',
    category: 'Plastics',
    price: 15,
    stock: 1800,
    grade: 'PET bottles · washed',
    description:
      'Baled and sorted PET plastic with consistent quality for responsible reprocessing and manufacturing.',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHb8oTyJRZLSir__i9vtXreaKGMCZwbF5g-pxrl_2v_PhPv_VAwLjpkkE&s=10',
    ],
  },
  {
    id: 'paper',
    name: 'Paper Scrap',
    category: 'Paper & board',
    price: 12,
    stock: 3200,
    grade: 'Sorted office paper',
    description:
      'Clean, dry paper stock separated for easy handling. A dependable choice for mills and paper recyclers.',
    images: [
      'https://tiimg.tistatic.com/fp/3/007/790/30-kilograms-industrial-grade-rectangular-easy-to-reuse-waste-paper-scraps-992.jpg',
    ],
  },
  {
    id: 'copper',
    name: 'Copper Scrap',
    category: 'Non-ferrous metals',
    price: 450,
    stock: 680,
    grade: 'Bright copper wire',
    description:
      'High-grade copper wire, carefully separated and inspected. Ask our team about larger wholesale lots.',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6dfRKYrWRTFRf-Mi7OhuwcGeSZiNSo1fM_gpn0AN96WYUDx6D2wQ-je4&s=10',
    ],
  },
  {
    id: 'aluminium',
    name: 'Aluminium Scrap',
    category: 'Non-ferrous metals',
    price: 80,
    stock: 1250,
    grade: 'Clean UBC & sheet',
    description:
      'Lightweight, sorted aluminium scrap sourced from clean streams for efficient remelting and reuse.',
    images: [
      'https://www.aishred.com/dm-content/uploads/njl9w48yae30.webp',
    ],
  },
  {
    id: 'ewaste',
    name: 'E-Waste',
    category: 'Electronics',
    price: 120,
    stock: 420,
    grade: 'Mixed circuit boards',
    description:
      'Responsible end-of-life electronics collected for secure sorting and material recovery.',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYnnESyE2_vuiuOWM7QsHwVbLH1Tttfi0zSJSA78CQienZVkNtq1VI17o&s=10',
    ],
  },
]

const categories = [
  { name: 'Ferrous metals', note: 'Iron, steel & more', image: materials[0].images[0] },
  { name: 'Plastics', note: 'PET, HDPE & more', image: materials[1].images[0] },
  { name: 'Paper & board', note: 'Paper, carton & more', image: materials[2].images[0] },
  { name: 'Non-ferrous metals', note: 'Copper, aluminium', image: materials[3].images[0] },
  { name: 'Electronics', note: 'Responsible e-waste', image: materials[5].images[0] },
]

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="9.5" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    arrow: <><path d="M4.5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    leaf: <><path d="M20 4c-9 0-15 4.6-15 11a5 5 0 0 0 5 5c6.4 0 10-7 10-16Z" /><path d="M5 19c3-4 6-6 11-9" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v11H3z" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    recycle: <><path d="m7 7 2-3h5l2 3" /><path d="m16 7 2 3-2 3" /><path d="m17 13 2 3-2 4h-5" /><path d="m12 20-3-1-2-4" /><path d="m7 15-4-1 1-5 3-2" /><path d="m7 7 3 1" /></>,
  }

  return <svg {...common}>{paths[name] || null}</svg>
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function ProductCard({ material, onOpen, onAdd }) {
  return (
    <article className="product-card">
      <button className="product-photo" type="button" onClick={onOpen} aria-label={`View ${material.name}`}>
        <img src={material.images[0]} alt={material.name} loading="lazy" />
        <span className="photo-tag">Verified quality</span>
      </button>
      <div className="product-info">
        <div className="product-title-row">
          <div>
            <p className="product-category">{material.category}</p>
            <h3>{material.name}</h3>
          </div>
          <span className="stock-dot" title="In stock" />
        </div>
        <div className="product-price-row">
          <span className="product-price">{formatPrice(material.price)} <small>/ kg</small></span>
          <span className="stock-label">{material.stock.toLocaleString('en-IN')} kg available</span>
        </div>
        <div className="product-actions">
          <button className="button button-outline" type="button" onClick={onOpen}>View details</button>
          <button className="button button-primary small-button" type="button" onClick={onAdd}>
            <Icon name="plus" size={16} /> Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductDialog({ material, onClose, onAdd }) {
  const [activeImage, setActiveImage] = useState(material.images[0])
  const [weight, setWeight] = useState(100)

  function updateWeight(nextWeight) {
    setWeight(Math.max(1, Math.min(material.stock, Number(nextWeight) || 1)))
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Close product details">
          <Icon name="close" />
        </button>
        <div className="dialog-gallery">
          <img className="dialog-main-image" src={activeImage} alt={material.name} />
          <div className="thumbnail-row">
            {material.images.map((image, index) => (
              <button
                className={`thumbnail ${activeImage === image ? 'is-active' : ''}`}
                type="button"
                key={image}
                onClick={() => setActiveImage(image)}
                aria-label={`Show product image ${index + 1}`}
                aria-pressed={activeImage === image}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="dialog-content">
          <p className="eyebrow">{material.category} <span>·</span> {material.grade}</p>
          <h2 id="dialog-title">{material.name}</h2>
          <p className="dialog-description">{material.description}</p>
          <div className="dialog-price">{formatPrice(material.price)} <span>/ kg</span></div>
          <p className="availability"><span className="stock-dot" /> In stock · {material.stock.toLocaleString('en-IN')} kg available</p>
          <label className="weight-label" htmlFor="weight-input">Select weight</label>
          <div className="weight-control">
            <button type="button" onClick={() => updateWeight(weight - 25)} aria-label="Decrease weight"><Icon name="minus" size={17} /></button>
            <input id="weight-input" type="number" min="1" max={material.stock} value={weight} onChange={(event) => updateWeight(event.target.value)} />
            <span>kg</span>
            <button type="button" onClick={() => updateWeight(weight + 25)} aria-label="Increase weight"><Icon name="plus" size={17} /></button>
          </div>
          <div className="order-total"><span>Estimated total</span><strong>{formatPrice(material.price * weight)}</strong></div>
          <div className="dialog-actions">
            <button className="button button-outline" type="button" onClick={() => {
              window.location.href = `mailto:hello@scrapworld.in?subject=${encodeURIComponent(`Enquiry about ${material.name}`)}&body=${encodeURIComponent(`Hello, I would like to enquire about ${weight} kg of ${material.name}.`)}`
            }}>Make an enquiry</button>
            <button className="button button-primary" type="button" onClick={() => onAdd(material, weight)}>Buy now <Icon name="arrow" size={17} /></button>
          </div>
          <p className="dialog-note"><Icon name="shield" size={16} /> Final price and delivery confirmed at checkout.</p>
        </div>
      </section>
    </div>
  )
}

function CartDrawer({ cart, onClose, onChangeWeight, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.material.price * item.weight, 0)

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="cart-drawer" aria-label="Shopping cart">
        <div className="drawer-heading">
          <div><p className="eyebrow">YOUR SELECTION</p><h2>Your cart <span>({cart.length})</span></h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close cart"><Icon name="close" /></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty-cart"><span className="empty-cart-icon"><Icon name="cart" size={28} /></span><h3>Your cart is ready for a fresh start.</h3><p>Explore quality-checked materials and add a quantity to get started.</p><button className="button button-primary" type="button" onClick={onClose}>Explore materials</button></div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(({ material, weight }) => (
                <div className="cart-item" key={material.id}>
                  <img src={material.images[0]} alt="" />
                  <div className="cart-item-info">
                    <div className="cart-item-top"><h3>{material.name}</h3><button type="button" onClick={() => onRemove(material.id)} aria-label={`Remove ${material.name}`}><Icon name="close" size={16} /></button></div>
                    <p>{formatPrice(material.price)} / kg</p>
                    <div className="cart-quantity">
                      <button type="button" onClick={() => onChangeWeight(material.id, weight - 25)} aria-label={`Decrease ${material.name} quantity`}><Icon name="minus" size={14} /></button>
                      <span>{weight} kg</span>
                      <button type="button" onClick={() => onChangeWeight(material.id, weight + 25)} aria-label={`Increase ${material.name} quantity`}><Icon name="plus" size={14} /></button>
                      <strong>{formatPrice(material.price * weight)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
              <p>Delivery and final weights are confirmed with our team.</p>
              <button className="button button-primary checkout-button" type="button" onClick={onCheckout}>Continue to order <Icon name="arrow" size={17} /></button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function AboutPage() {
  return (
    <section className="info-page section-wrap">
      <div className="materials-breadcrumb"><Link to="/">Home</Link><span>/</span><span>About us</span></div>
      <div className="about-page-layout">
        <div className="about-image about-page-image">
          <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1300&q=85" alt="Green landscape representing a healthier planet" />
          <span className="image-badge"><Icon name="recycle" size={24} /> A more circular<br />future starts here</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">ABOUT SMART SCRAP SHOP MANAGEMENT SYSTEM </p>
          <h1>Waste less.<br /><em>Move forward.</em></h1>
          <p>We connect businesses with dependable scrap materials and make responsible recycling easier to access. Every well-sorted material is an opportunity to make something new.</p>
          <p>Our marketplace brings buyers and sellers together around transparent prices, reliable stock and a shared belief that valuable resources deserve another life.</p>
          <Link className="button button-primary" to="/scrap-materials">Explore our materials <Icon name="arrow" size={17} /></Link>
          <div className="about-stats"><div><strong>10<span>+</span></strong><small>years in circular trade</small></div><div><strong>24<span>/7</span></strong><small>here when you need us</small></div></div>
        </div>
      </div>
      <div className="about-page-values">
        <div><span className="promise-icon"><Icon name="shield" size={22} /></span><strong>Quality you can trust</strong><p>Every material is checked and graded, so you know what you are buying.</p></div>
        <div><span className="promise-icon"><Icon name="truck" size={22} /></span><strong>Reliable supply</strong><p>We help keep useful materials moving to the businesses that need them.</p></div>
        <div><span className="promise-icon"><Icon name="recycle" size={22} /></span><strong>Better by nature</strong><p>Giving materials another use supports a more circular future.</p></div>
      </div>
    </section>
  )
}

function ContactPage() {
  function sendEnquiry(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const subject = `Scrap World enquiry from ${formData.get('name')}`
    const body = [
      `Name: ${formData.get('name')}`,
      `Email: ${formData.get('email')}`,
      `Material of interest: ${formData.get('material') || 'Not specified'}`,
      '',
      formData.get('message'),
    ].join('\n')
    window.location.href = `mailto:hello@scrapworld.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <section className="contact-page">
      <div className="section-wrap">
        <div className="materials-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Contact</span></div>
        <div className="contact-page-heading">
          <p className="eyebrow">LET'S MAKE IT COUNT</p>
          <h1>How can we <em>help?</em></h1>
          <p>Ask us about material availability, bulk quantities, pricing or delivery. Our team is ready to help.</p>
        </div>
        <div className="contact-page-layout">
          <form className="enquiry-form" onSubmit={sendEnquiry}>
            <h2>Send us an enquiry</h2>
            <p>Share a few details and we’ll help you find the right materials.</p>
            <div className="form-field-row">
              <label>Your name<input name="name" type="text" autoComplete="name" placeholder="e.g. Alex Morgan" required /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
            </div>
            <label>Material of interest
              <select name="material" defaultValue="">
                <option value="">Select a material (optional)</option>
                {materials.map((material) => <option key={material.id}>{material.name}</option>)}
              </select>
            </label>
            <label>Your message<textarea name="message" rows="5" placeholder="Tell us what you’re looking for..." required /></label>
            <button className="button button-primary" type="submit">Send enquiry <Icon name="arrow" size={17} /></button>
            <small className="form-note">Your email app will open with your enquiry ready to send.</small>
          </form>
          <aside className="contact-details">
            <p className="eyebrow">GET IN TOUCH</p>
            <h2>Good conversations start here.</h2>
            <p>For a quick question or a larger order, reach our team directly.</p>
            <a href="mailto:hello@scrapworld.in"><span className="contact-detail-icon"><Icon name="mail" size={19} /></span><span><small>Email us</small><strong>hello@scrapworld.in</strong></span></a>
            <div className="contact-hours"><span className="contact-detail-icon"><Icon name="truck" size={19} /></span><span><small>Business hours</small><strong>Monday – Saturday</strong><small>9:00 am – 6:00 pm</small></span></div>
            <div className="contact-assurance"><Icon name="shield" size={17} /> Trusted recycling partner since 2026</div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function App() {
  const location = useLocation()
  const { pathname } = location
  const navigate = useNavigate()
  const { user, logout, authError } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const currentPath = pathname.replace(/\/+$/, '') || '/'
  const isMaterialsPage = currentPath === '/scrap-materials'
  const isAboutPage = currentPath === '/about-us'
  const isContactPage = currentPath === '/contact'
  const isLoginPage = currentPath === '/login'
  const isRegisterPage = currentPath === '/register'
  const isForgotPasswordPage = currentPath === '/forgot-password'
  const isResetPasswordPage = currentPath === '/reset-password'
  const isAccountPage = currentPath === '/account'
  const isCheckoutPage = currentPath === '/checkout'
  const isOrderConfirmationPage = /^\/order-confirmation\/[^/]+$/.test(currentPath)
  const isCustomerOrdersPage = currentPath === '/my-orders'
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('search') || '')
  const activeCategory = useMemo(() => {
    const category = new URLSearchParams(location.search).get('category')
    return categories.some((item) => item.name === category) ? category : 'All materials'
  }, [location.search])
  const activeNav = isMaterialsPage ? 'Scrap materials' : isAboutPage ? 'About us' : isContactPage ? 'Contact' : isLoginPage ? 'Log in' : isRegisterPage ? 'Register' : 'Home'
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isPublicPage = publicPaths.has(pathname.replace(/\/+$/, '') || '/')
  const filteredMaterials = useMemo(() => materials.filter((material) => {
    const matchesCategory = activeCategory === 'All materials' || material.category === activeCategory
    const searchText = `${material.name} ${material.category} ${material.grade}`.toLowerCase()
    return matchesCategory && searchText.includes(query.trim().toLowerCase())
  }), [activeCategory, query])

  if (currentPath === '/admin/login') {
    return <AdminLogin />
  }
  if (currentPath.startsWith('/admin')) {
    const adminSections = {
      '/admin/products': 'products',
      '/admin/categories': 'categories',
      '/admin/inventory': 'inventory',
      '/admin/customers': 'customers',
    }
    if (currentPath !== '/admin' && currentPath !== '/admin/dashboard' && currentPath !== '/admin/orders' && !adminSections[currentPath]) {
      return <Navigate to="/admin" replace />
    }
    return (
      <ProtectedRoute roles={['ADMIN']} loginPath="/admin/login">
        <AdminLayout>
          {adminSections[currentPath]
            ? <AdminManagement section={adminSections[currentPath]} />
            : currentPath === '/admin/orders'
              ? <AdminOrders />
            : <AdminDashboard />}
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Please try again.')
    }
  }

  function addToCart(material, weight = 100) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.material.id === material.id)
      if (existing) {
        return currentCart.map((item) => item.material.id === material.id
          ? { ...item, weight: Math.min(material.stock, item.weight + weight) }
          : item)
      }
      return [...currentCart, { material, weight: Math.min(material.stock, weight) }]
    })
    setSelectedMaterial(null)
    setCartOpen(true)
  }

  function changeCartWeight(id, weight) {
    setCart((currentCart) => currentCart.map((item) => item.material.id === id
      ? { ...item, weight: Math.max(1, Math.min(item.material.stock, weight)) }
      : item))
  }

  function openCart() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/scrap-materials' } } })
      return
    }
    setCartOpen(true)
  }

  function handleSearch(event) {
    event.preventDefault()
    const search = String(new FormData(event.currentTarget).get('search') || '').trim()
    setQuery(search)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeCategory !== 'All materials') params.set('category', activeCategory)
    navigate(`/scrap-materials${params.size ? `?${params}` : ''}`)
  }

  function handleCategoryChange(category) {
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (category !== 'All materials') params.set('category', category)
    navigate(`/scrap-materials${params.size ? `?${params}` : ''}`)
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Scrap materials', href: '/scrap-materials' },
    { label: 'About us', href: '/about-us' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <div className="site-shell">
      <div className="topline"><span><Icon name="leaf" size={14} /> A better way to give materials a second life</span><span className="topline-right">Trusted recycling partner <b>·</b> Since 2026</span></div>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Scrap World home">
          <span className="brand-mark"><Icon name="recycle" size={26} /></span>
          <span className="brand-copy"><strong><span>Smart Scrap Shop Management System</span></strong><small>Materials with a future</small></span>
        </Link>
        <button className="mobile-menu icon-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navLinks.map((link) => <Link className={activeNav === link.label ? 'active' : ''} aria-current={activeNav === link.label ? 'location' : undefined} to={link.href} key={link.label}>{link.label}</Link>)}
          {user ? (
            <>
              <Link to="/account">My account</Link>
              {user.role !== 'ADMIN' && <Link to="/my-orders">My orders</Link>}
              <Link to={user.role === 'ADMIN' ? '/admin' : '/admin/login'}>Admin</Link>
              <button className="main-nav-action" type="button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
              <Link to="/admin/login">Admin</Link>
            </>
          )}
        </nav>
        <form className="header-search" role="search" onSubmit={handleSearch}>
          <input name="search" aria-label="Search scrap materials" placeholder="Search materials..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" aria-label="Search"><Icon name="search" size={19} /></button>
        </form>
        <button className="cart-trigger" type="button" onClick={openCart} aria-label={`Open cart, ${cart.length} items`}>
          <Icon name="cart" size={21} /><span>Cart</span><b>{cart.length}</b>
        </button>
        {user && (
          <div className="header-auth">
              <Link to="/account" className="header-user">{user.fullName}</Link>
              {user.role === 'ADMIN' && <Link to="/admin" className="header-user">Admin</Link>}
              <button type="button" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>
      {(authError || logoutError) && <p className="auth-status-banner" role="status">{logoutError || authError}</p>}
      {location.state?.message && location.pathname === '/' && (
        <p className="auth-status-banner auth-status-success" role="status">{location.state.message}</p>
      )}

      <main>
        <ProtectedRoute publicRoute={isPublicPage}>
        {isLoginPage ? (
          <Login />
        ) : isRegisterPage ? (
          <Register />
        ) : isForgotPasswordPage ? (
          <ForgotPassword />
        ) : isResetPasswordPage ? (
          <ResetPassword />
        ) : isAccountPage ? (
          <Account />
        ) : isCheckoutPage ? (
          <ProtectedRoute roles={['CUSTOMER']}>
            <CheckoutPage
              cart={cart}
              user={user}
              onOrderPlaced={() => setCart([])}
            />
          </ProtectedRoute>
        ) : isOrderConfirmationPage ? (
          <ProtectedRoute roles={['CUSTOMER']}><OrderConfirmationPage /></ProtectedRoute>
        ) : isCustomerOrdersPage ? (
          <ProtectedRoute roles={['CUSTOMER']}><CustomerOrdersPage /></ProtectedRoute>
        ) : isMaterialsPage ? (
          <section className="materials-page-section section-wrap" id="materials">
            <div className="materials-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Scrap materials</span></div>
            <div className="section-heading materials-heading">
              <div><p className="eyebrow">CURATED FOR QUALITY</p><h1>Smart Scrap Shop Management System</h1><p className="materials-intro">Explore quality-checked materials, transparent prices and stock ready for your next project.</p></div>
              <div className="material-tools">
                <div className="category-select-wrap">
                  <label className="sr-only" htmlFor="category-select">Filter by category</label>
                  <select id="category-select" value={activeCategory} onChange={(event) => handleCategoryChange(event.target.value)}>
                    <option>All materials</option>
                    {categories.map((category) => <option key={category.name}>{category.name}</option>)}
                  </select>
                  <Icon name="chevron" size={15} />
                </div>
                <span className="result-count">{filteredMaterials.length} materials</span>
              </div>
            </div>
            {filteredMaterials.length ? (
              <div className="product-grid">
                {filteredMaterials.map((material) => <ProductCard
                  key={material.id}
                  material={material}
                  onOpen={() => setSelectedMaterial(material)}
                  onAdd={() => addToCart(material)}
                />)}
              </div>
            ) : (
              <div className="no-results"><Icon name="search" size={25} /><h3>No matching materials yet</h3><p>Try a different search or choose another category.</p><button className="button button-outline" type="button" onClick={() => { setQuery(''); navigate('/scrap-materials') }}>Clear filters</button></div>
            )}
          </section>
        ) : isAboutPage ? (
          <AboutPage />
        ) : isContactPage ? (
          <ContactPage />
        ) : (
          <>
        <section className="hero" id="home">
          <div className="hero-photo" />
          <div className="hero-content">
            <p className="hero-kicker"><span /> REUSE MORE. WASTE LESS.</p>
            <h1>Buy &amp; Sell<br /><em>Scrap Materials</em></h1>
            <p className="hero-description">A trusted marketplace for quality scrap materials.<br className="desktop-break" /> Buy better, sell smarter, and keep valuable resources in motion.</p>
            <div className="hero-actions">
              <Link className="button button-primary hero-button" to="/scrap-materials">Explore scrap collection <Icon name="arrow" size={18} /></Link>
              <Link className="button button-glass" to="/about-us">Our approach</Link>
            </div>
            <div className="hero-trust"><span><Icon name="shield" size={17} /> Quality checked</span><span><Icon name="truck" size={18} /> Reliable supply</span></div>
          </div>
          <div className="hero-caption"><span>SCRAP, REIMAGINED</span><span className="caption-line" /><span>01 — 06</span></div>
          <div className="hero-stamp"><Icon name="recycle" size={31} /><span>MAKE IT<br />CIRCULAR</span></div>
        </section>

        <section className="category-section section-wrap" id="categories">
          <div className="section-heading">
            <div><p className="eyebrow">FIND YOUR MATERIAL</p><h2>Explore by category</h2></div>
            <Link className="text-link" to="/scrap-materials">Browse all materials <Icon name="arrow" size={17} /></Link>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link className="category-card" to={`/scrap-materials?category=${encodeURIComponent(category.name)}`} key={category.name}>
                <span className="category-image"><img src={category.image} alt="" loading="lazy" /><span className="category-number">0{index + 1}</span></span>
                <span className="category-card-copy"><span><strong>{category.name}</strong><small>{category.note}</small></span><span className="category-arrow"><Icon name="arrow" size={17} /></span></span>
              </Link>
            ))}
          </div>
        </section>

          </>
        )}
        </ProtectedRoute>
      </main>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <Link className="brand footer-brand" to="/"><span className="brand-mark"><Icon name="recycle" size={25} /></span><span className="brand-copy"><strong><span>Smart Scrap Management System</span></strong><small>Materials with a future</small></span></Link>
          <p>Giving good materials another go.</p>
          <div className="footer-links">{navLinks.map((link) => <Link to={link.href} key={link.label}>{link.label}</Link>)}</div>
        </div>
        <div className="footer-bottom section-wrap"><span>© {currentYear} Scrap World. All rights reserved.</span><span>Thoughtfully sourced. Ready for what’s next.</span></div>
      </footer>

      {selectedMaterial && <ProductDialog key={selectedMaterial.id} material={selectedMaterial} onClose={() => setSelectedMaterial(null)} onAdd={addToCart} />}
      {cartOpen && <CartDrawer
        cart={cart}
        onClose={() => setCartOpen(false)}
        onChangeWeight={changeCartWeight}
        onRemove={(id) => setCart((items) => items.filter((item) => item.material.id !== id))}
        onCheckout={() => {
          setCartOpen(false)
          navigate('/checkout')
        }}
      />}
    </div>
  )
}

export default App
