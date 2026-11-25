import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './admin.css'

function getErrorMessage(error) {
  if (!error.response) {
    return 'Could not reach the ScrapWorld API. Make sure the backend is running, then try again.'
  }
  return error.response.data?.message || 'Could not sign in. Please check your details and try again.'
}

export default function AdminLogin() {
  const { adminLogin, loading, user, authError } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (loading) {
    return <p className="admin-loading" role="status">Checking your administrator session…</p>
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    const form = new FormData(event.currentTarget)

    try {
      await adminLogin({
        email: String(form.get('email')).trim(),
        password: form.get('password'),
        rememberMe: form.get('rememberMe') === 'on',
      })
      navigate('/admin', { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Link className="admin-brand" to="/" aria-label="ScrapWorld home">
          <span className="admin-brand-mark">SW</span>
          <span>Smart Scrap Shop Management System <small>ADMINISTRATION</small></span>
        </Link>
        <p className="admin-eyebrow">SECURE ADMINISTRATOR ACCESS</p>
        <h1 id="admin-login-title">Welcome back</h1>
        <p className="admin-login-intro">Sign in with an administrator account to manage Smart Scrap Shop Management System.</p>
        {(errorMessage || authError) && <p className="admin-alert" role="alert">{errorMessage || authError}</p>}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength="150"
            placeholder="admin@example.com"
            required
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength="72"
            required
          />
          <label className="admin-remember">
            <input type="checkbox" name="rememberMe" />
            <span>Keep me signed in</span>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>
        <Link className="admin-back-link" to="/">← Back to Smart Scrap Shop Management System</Link>
        <p className="admin-login-security">Administrator access is verified by the server for every protected request.</p>
      </section>
    </main>
  )
}
