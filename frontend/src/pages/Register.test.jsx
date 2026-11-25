// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Register from './Register'
import { useAuth } from '../context/useAuth'
import { registerUser } from '../services/authService'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/authService', () => ({
  registerUser: vi.fn(),
}))

describe('Register', () => {
  const login = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ login })
    login.mockResolvedValue({ user: { role: 'CUSTOMER' } })
    registerUser.mockResolvedValue({ success: true })
  })

  it('registers, signs in, and sends the customer to the home page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<p>Welcome home</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Phone number'), '9876543210')
    await user.type(screen.getByLabelText('Password'), 'Alex@123')
    await user.type(screen.getByLabelText('Confirm password'), 'Alex@123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(screen.getByText('Welcome home')).toBeTruthy())
    expect(registerUser).toHaveBeenCalledWith({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '9876543210',
      password: 'Alex@123',
      confirmPassword: 'Alex@123',
    })
    expect(login).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'Alex@123',
      rememberMe: false,
    })
  })
})
