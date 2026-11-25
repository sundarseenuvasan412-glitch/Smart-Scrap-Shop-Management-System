import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './admin.css'

const navigation = [
  { label: 'Dashboard', path: '/admin', available: true, icon: '▦' },
  { label: 'Products', path: '/admin/products', available: true, icon: '◇' },
  { label: 'Categories', path: '/admin/categories', available: true, icon: '◫' },
  { label: 'Inventory', path: '/admin/inventory', available: true, icon: '▤' },
  { label: 'Orders', path: '/admin/orders', available: true, icon: '⇄' },
  { label: 'Customers', path: '/admin/customers', available: true, icon: '◎' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const initials = user?.fullName
    ?.split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const activeSection = navigation.find((item) => item.path === location.pathname)?.label || 'Dashboard'

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Please try again.')
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand admin-sidebar-brand" to="/admin">
          <span className="admin-brand-mark">SW</span>
          <span>Smart Scrap Shop Management System <small>ADMINISTRATION</small></span>
        </Link>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map((item) => item.available ? (
            <Link
              className={`admin-nav-item${location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/dashboard') ? ' active' : ''}`}
              to={item.path}
              key={item.label}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="admin-nav-item admin-nav-disabled" key={item.label} aria-disabled="true" title="Available in a later development module">
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              <span className="admin-nav-soon">Soon</span>
            </span>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="admin-status-dot" />
          <span>Secure admin session</span>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span className="admin-topbar-kicker">SMART SCRAP SHOP MANAGEMENT SYSTEM</span>
            <strong>Admin {activeSection.toLowerCase()}</strong>
          </div>
          <div className="admin-profile">
            <div className="admin-profile-copy">
              <strong>{user?.fullName}</strong>
              <span>Administrator</span>
            </div>
            <span className="admin-avatar" aria-hidden="true">{initials}</span>
            <button type="button" className="admin-logout" onClick={handleLogout}>Sign out</button>
          </div>
        </header>
        {logoutError && <p className="admin-alert admin-logout-alert" role="alert">{logoutError}</p>}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
