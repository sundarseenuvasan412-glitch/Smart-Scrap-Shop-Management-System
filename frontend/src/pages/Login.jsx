import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Auth.css'

function responseMessage(error) {
  return error.response?.data?.message || 'We could not sign you in. Please try again.'
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice] = useState(location.state?.message || '')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const form = new FormData(event.currentTarget)
      await login({
        email: form.get('email').trim(),
        password: form.get('password'),
        rememberMe: form.get('rememberMe') === 'on',
      })
      const destination = location.state?.from
      navigate(destination ? `${destination.pathname}${destination.search || ''}` : '/', { replace: true })
    } catch (error) {
      setErrorMessage(responseMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in to <em>SCRAP SHOP MANAGEMENT SYSTEM</em></h1>
        <p className="auth-intro">Access your account and keep your materials moving.</p>
        {notice && <p className="auth-alert auth-alert-success" role="status">{notice}</p>}
        {errorMessage && <p className="auth-alert auth-alert-error" role="alert">{errorMessage}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength="150" required />
          <div className="auth-label-row">
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <div className="password-input">
            <input id="login-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" required />
            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
              {passwordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          <label className="auth-checkbox"><input type="checkbox" name="rememberMe" /> <span>Remember me</span></label>
          <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">New to SCRAP SHOP MANAGEMENT SYSTEM? <Link to="/register">Create an account</Link></p>
        <p className="auth-security-note">Your sign-in is protected with an HttpOnly secure-session cookie.</p>
      </div>
      <aside className="auth-aside">
        <span className="auth-aside-mark">SW</span>
        <p className="eyebrow">MATERIALS WITH A FUTURE</p>
        <h2>Good things deserve another life.</h2>
        <p>Sign in to continue building a more circular future with quality-checked materials.</p>
      </aside>
    </section>
  )
}
