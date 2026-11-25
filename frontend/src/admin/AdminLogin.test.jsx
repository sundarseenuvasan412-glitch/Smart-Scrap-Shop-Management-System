// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminLogin from './AdminLogin'
import { useAuth } from '../context/useAuth'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

function renderAdminLogin() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<p>Admin dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLogin', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('authenticates with the dedicated admin login flow', async () => {
    const adminLogin = vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } })
    useAuth.mockReturnValue({ adminLogin, loading: false, user: null })
    renderAdminLogin()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Admin@123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to dashboard' }))

    await waitFor(() => expect(adminLogin).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Admin@123',
      rememberMe: false,
    }))
    expect(await screen.findByText('Admin dashboard')).toBeTruthy()
  })

  it('shows a server authentication error without navigating', async () => {
    const adminLogin = vi.fn().mockRejectedValue({
      response: { data: { message: 'Email or password is incorrect' } },
    })
    useAuth.mockReturnValue({ adminLogin, loading: false, user: null })
    renderAdminLogin()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'person@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to dashboard' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Email or password is incorrect')
  })

  it('explains when the backend cannot be reached', async () => {
    const adminLogin = vi.fn().mockRejectedValue(new Error('Network Error'))
    useAuth.mockReturnValue({ adminLogin, loading: false, user: null })
    renderAdminLogin()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to dashboard' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Could not reach the ScrapWorld API. Make sure the backend is running, then try again.',
    )
  })
})
