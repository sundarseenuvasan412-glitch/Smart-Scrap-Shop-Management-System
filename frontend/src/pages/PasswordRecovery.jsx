import { Link } from 'react-router-dom'
import './Auth.css'

export function ForgotPassword() {
  return (
    <section className="auth-page auth-page-message">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT SUPPORT</p>
        <h1>Password <em>recovery</em></h1>
        <p className="auth-intro">
          Password recovery is not enabled yet. Email delivery and secure, time-limited reset tokens must be configured before a reset can be requested.
        </p>
        <Link className="button button-primary auth-submit" to="/login">Back to sign in</Link>
        <p className="auth-switch">Need help? <a href="mailto:hello@scrapworld.in">Contact Smart Scrap Shop Management System</a></p>
      </div>
    </section>
  )
}

export function ResetPassword() {
  return (
    <section className="auth-page auth-page-message">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT SUPPORT</p>
        <h1>Reset your <em>password</em></h1>
        <p className="auth-intro">
          Password reset links are not active because email verification and reset-token delivery have not been configured.
        </p>
        <Link className="button button-primary auth-submit" to="/login">Back to sign in</Link>
      </div>
    </section>
  )
}
