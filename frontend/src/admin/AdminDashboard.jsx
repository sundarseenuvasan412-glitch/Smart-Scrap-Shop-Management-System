import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../services/adminService'
import './admin.css'

const metricDefinitions = [
  { label: 'Registered customers', key: 'customerCount', caption: 'Customer accounts', icon: '◎' },
  { label: 'Active products', key: 'productCount', caption: 'Listed scrap materials', icon: '◇' },
  { label: 'Orders', key: 'orderCount', caption: 'All order statuses', icon: '⇄' },
  { label: 'Paid revenue', key: 'revenue', caption: 'Successful payments · all time', icon: '₹', currency: true },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMonth(month) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', {
    month: 'short',
    timeZone: 'UTC',
  })
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true

    getAdminDashboard()
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Could not load dashboard data.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retry])

  function retryDashboardLoad() {
    setError('')
    setLoading(true)
    setRetry((value) => value + 1)
  }

  return (
    <section className="admin-dashboard" aria-labelledby="dashboard-title">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">OVERVIEW</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p>Here’s an overview of the Smart Scrap Shop Management System marketplace.</p>
        </div>
        <span className="admin-live-badge"><span /> Live database</span>
      </div>

      {error && (
        <div className="admin-alert admin-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={retryDashboardLoad}>Try again</button>
        </div>
      )}

      <div className="admin-metric-grid">
        {metricDefinitions.map((metric, index) => {
          const value = dashboard?.[metric.key]
          const formattedValue = typeof value !== 'number'
            ? '—'
            : metric.currency
              ? formatCurrency(value)
              : value.toLocaleString('en-IN')

          return (
            <article className={`admin-metric-card${index === 0 ? ' admin-metric-primary' : ''}`} key={metric.key}>
              <div className="admin-metric-top">
                <span>{metric.label}</span>
                <span className="admin-metric-icon" aria-hidden="true">{metric.icon}</span>
              </div>
              <strong className="admin-metric-value">
                {loading
                  ? <span className="admin-skeleton" aria-label={`Loading ${metric.label.toLowerCase()}`} />
                  : error ? '—' : formattedValue}
              </strong>
              <span className="admin-metric-caption">{metric.caption}</span>
            </article>
          )
        })}
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-analytics-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Sales analytics</h2>
              <p>Orders and paid revenue · last 6 months</p>
            </div>
            <span className="admin-panel-tag">Monthly</span>
          </div>
          {loading ? (
            <div className="admin-chart-loading" role="status">Loading sales data…</div>
          ) : error ? (
            <div className="admin-chart-loading">Sales data is unavailable.</div>
          ) : (
            <SalesChart metrics={dashboard?.monthlyMetrics ?? []} />
          )}
        </section>

        <section className="admin-panel admin-readiness-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Workspace status</h2>
              <p>Data sources connected to this dashboard</p>
            </div>
          </div>
          <ul className="admin-readiness-list">
            <li><span className="admin-readiness-indicator ready" />Customer accounts <strong>Connected</strong></li>
            <li><span className="admin-readiness-indicator ready" />Products <strong>Connected</strong></li>
            <li><span className="admin-readiness-indicator ready" />Orders and payments <strong>Connected</strong></li>
            <li><span className="admin-readiness-indicator" />Enquiries and selling requests <strong>Not connected</strong></li>
          </ul>
        </section>
      </div>

      <p className="admin-data-note">Revenue includes successful payments only. Product, order, and payment records are stored in the backend database.</p>
    </section>
  )
}

function SalesChart({ metrics }) {
  const validMetrics = Array.isArray(metrics) ? metrics : []
  const hasSales = validMetrics.some((metric) => Number(metric.revenue) > 0 || metric.orderCount > 0)
  const maxRevenue = Math.max(0, ...validMetrics.map((metric) => Number(metric.revenue) || 0))

  if (validMetrics.length === 0 || !hasSales) {
    return (
      <div className="admin-empty-state">
        <span className="admin-empty-icon" aria-hidden="true">⌁</span>
        <strong>No sales recorded yet</strong>
        <p>Monthly order and paid-revenue trends will appear here when transactions are recorded.</p>
      </div>
    )
  }

  return (
    <div className="admin-sales-chart" role="group" aria-label="Monthly paid revenue for the last six months">
      <div className="admin-chart-bars">
        {validMetrics.map((metric) => {
          const revenue = Number(metric.revenue) || 0
          const barHeight = maxRevenue > 0 ? Math.max(4, (revenue / maxRevenue) * 100) : 4

          return (
            <div className="admin-chart-column" key={metric.month}>
              <div className="admin-chart-bar-wrap">
                <span
                  className="admin-chart-bar"
                  style={{ height: `${barHeight}%` }}
                  title={`${formatCurrency(revenue)} · ${metric.orderCount} orders`}
                />
              </div>
              <span className="admin-chart-month">{formatMonth(metric.month)}</span>
            </div>
          )
        })}
      </div>
      <p className="admin-chart-caption">Bars show paid revenue. Hover or focus a bar to see its revenue and order count.</p>
      <ul className="admin-chart-data">
        {validMetrics.map((metric) => (
          <li key={metric.month}>
            <span>{formatMonth(metric.month)}</span>
            <span>{metric.orderCount.toLocaleString('en-IN')} orders</span>
            <strong>{formatCurrency(Number(metric.revenue) || 0)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
