// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/useAuth'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

function renderProtectedRoute(initialEntry, routeProps = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path={initialEntry}
          element={(
            <ProtectedRoute {...routeProps}>
              <p>Private page</p>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/admin/login" element={<p>Admin login page</p>} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets visitors open explicitly public pages', () => {
    useAuth.mockReturnValue({ user: null, loading: true })

    renderProtectedRoute('/register', { publicRoute: true })

    expect(screen.getByText('Private page')).toBeTruthy()
  })

  it('redirects signed-out visitors to login for protected pages', () => {
    useAuth.mockReturnValue({ user: null, loading: false })

    renderProtectedRoute('/scrap-materials')

    expect(screen.getByText('Login page')).toBeTruthy()
  })

  it('waits for the saved cookie session before checking access', () => {
    useAuth.mockReturnValue({ user: null, loading: true })

    renderProtectedRoute('/contact')

    expect(screen.getByRole('status').textContent).toContain('Checking your account')
  })

  it('denies customer access to admin pages', () => {
    useAuth.mockReturnValue({ user: { role: 'CUSTOMER' }, loading: false })

    renderProtectedRoute('/admin', { roles: ['ADMIN'] })

    expect(screen.getByText('Home page')).toBeTruthy()
  })

  it('redirects signed-out visitors to administrator login when configured', () => {
    useAuth.mockReturnValue({ user: null, loading: false })

    renderProtectedRoute('/admin', { roles: ['ADMIN'], loginPath: '/admin/login' })

    expect(screen.getByText('Admin login page')).toBeTruthy()
  })
})