import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { getCurrentUser, loginAdmin as loginAdminUser, loginUser, logoutUser } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let active = true
    const handleExpiredSession = () => {
      setUser(null)
      setAuthError('Your sign-in expired. Please sign in again.')
    }

    window.addEventListener('scrapworld:session-expired', handleExpiredSession)

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error) => {
        if (!active) return
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          setAuthError(error.response?.data?.message || 'Could not check your sign-in status.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      window.removeEventListener('scrapworld:session-expired', handleExpiredSession)
    }
  }, [])

  async function login(credentials) {
    const response = await loginUser(credentials)
    setUser(response.user)
    setAuthError('')
    return response
  }

  async function adminLogin(credentials) {
    const response = await loginAdminUser(credentials)
    setUser(response.user)
    setAuthError('')
    return response
  }

  async function logout() {
    await logoutUser()
    setUser(null)
    setAuthError('')
  }

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    login,
    adminLogin,
    logout,
  }), [user, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
