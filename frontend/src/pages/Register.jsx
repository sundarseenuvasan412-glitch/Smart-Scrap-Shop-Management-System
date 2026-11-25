import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { registerUser } from '../services/authService'
import './Auth.css'

function responseMessage(error) {
  return error.response?.data?.message || 'We could not create your account. Please try again.'
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      navigate('/', { replace: true, state: { message: 'Your account is ready. Welcome to ScrapWorld!' } })
    }
  }, [navigate, success])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    const form = new FormData(event.currentTarget)
    const password = form.get('password')
    const phone = form.get('phone').replace(/[\s()-]/g, '')
    if (password !== form.get('confirmPassword')) {
      setErrorMessage('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    if (!/^(?:\+[1-9]\d{6,13}|[1-9]\d{6,14})$/.test(phone)) {
      setErrorMessage('Enter a valid phone number.')
      return
    }

    setSubmitting(true)
    try {
      const email = form.get('email').trim()
      await registerUser({
        fullName: form.get('fullName').trim(),
        email,
        phone,
        password,
        confirmPassword: form.get('confirmPassword'),
      })
      try {
        await login({ email, password, rememberMe: false })
      } catch {
        navigate('/login', {
          replace: true,
          state: { message: 'Your account was created. Sign in to continue.' },
        })
        return
      }
      setSuccess(true)
    } catch (error) {
      setErrorMessage(responseMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page auth-page-register">
      <div className="auth-card">
        <p className="eyebrow">JOIN SCRAPWORLD</p>
        <h1>Create your <em>account</em></h1>
        <p className="auth-intro">A few details and you’re ready to get started.</p>
        {success ? (
          <div className="auth-alert auth-alert-success" role="status">
            Account created successfully. Taking you to sign in…
          </div>
        ) : (
          <>
            {errorMessage && <p className="auth-alert auth-alert-error" role="alert">{errorMessage}</p>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="register-name">Full name</label>
              <input id="register-name" name="fullName" type="text" autoComplete="name" maxLength="100" placeholder="Alex Morgan" required />
              <label htmlFor="register-email">Email address</label>
              <input id="register-email" name="email" type="email" autoComplete="email" maxLength="150" placeholder="you@example.com" required />
              <label htmlFor="register-phone">Phone number</label>
              <input id="register-phone" name="phone" type="tel" autoComplete="tel" pattern="\+?[1-9][0-9\s()-]{6,19}" title="Enter a valid phone number" placeholder="+91 9876543210" required />
              <label htmlFor="register-password">Password</label>
              <div className="password-input">
                <input id="register-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" minLength="8" maxLength="72" required />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
                  {passwordVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <label htmlFor="register-confirm-password">Confirm password</label>
              <input id="register-confirm-password" name="confirmPassword" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" minLength="8" maxLength="72" required />
              <label className="auth-checkbox">
                <input name="terms" type="checkbox" required />
                <span>I agree to the Terms and Conditions.</span>
              </label>
              <button className="button button-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </>
        )}
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        <p className="auth-security-note">New accounts receive the CUSTOMER role. Administrator access cannot be self-assigned.</p>
      </div>
      <aside className="auth-aside">
        <span className="auth-aside-mark">SW</span>
        <p className="eyebrow">A BETTER WAY TO BUY</p>
        <h2>Join a community that values every resource.</h2>
        <p>Explore quality-checked materials, transparent prices and supply you can trust.</p>
      </aside>
    </section>
  )
}
