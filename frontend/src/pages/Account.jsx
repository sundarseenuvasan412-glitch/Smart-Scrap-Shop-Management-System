import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ProtectedRoute from '../components/ProtectedRoute'
import './Auth.css'

export function Account() {
  const { user } = useAuth()
  return (
    <ProtectedRoute>
      <section className="auth-page auth-page-message">
        <div className="auth-card">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>Welcome, <em>{user.fullName}</em></h1>
          <p className="auth-intro">{user.email}</p>
          <p className="account-role">Account type: {user.role}</p>
          <Link className="button button-primary auth-submit" to="/scrap-materials">Browse materials</Link>
        </div>
      </section>
    </ProtectedRoute>
  )
}
