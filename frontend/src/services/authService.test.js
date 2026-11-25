// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { getCurrentUser, loginAdmin, loginUser, logoutUser, registerUser } from './authService'
import { ACCESS_TOKEN_KEY } from './authToken'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockResolvedValue({ data: { token: 'csrf-token' } })
  })

  it('fetches a CSRF token before registering', async () => {
    const details = {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '9876543210',
      password: 'Alex@123',
      confirmPassword: 'Alex@123',
    }
    api.post.mockResolvedValue({ data: { success: true } })

    await expect(registerUser(details)).resolves.toEqual({ success: true })
    expect(api.get).toHaveBeenCalledWith('/auth/csrf')
    expect(api.post).toHaveBeenCalledWith('/auth/register', details)
  })

  it('fetches a CSRF token before login and returns the user response', async () => {
    const response = { message: 'Login successful', token: 'customer-jwt', user: { id: 1, role: 'CUSTOMER' } }
    api.post.mockResolvedValue({ data: response })

    await expect(loginUser({ email: 'alex@example.com', password: 'Alex@123', rememberMe: false }))
      .resolves.toEqual(response)
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'alex@example.com',
      password: 'Alex@123',
      rememberMe: false,
    })
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('customer-jwt')
  })

  it('fetches a CSRF token before administrator login', async () => {
    const response = { message: 'Login successful', token: 'admin-jwt', user: { id: 2, role: 'ADMIN' } }
    api.post.mockResolvedValue({ data: response })

    await expect(loginAdmin({ email: 'admin@example.com', password: 'Admin@123', rememberMe: false }))
      .resolves.toEqual(response)
    expect(api.get).toHaveBeenCalledWith('/auth/csrf')
    expect(api.post).toHaveBeenCalledWith('/auth/admin/login', {
      email: 'admin@example.com',
      password: 'Admin@123',
      rememberMe: false,
    })
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('admin-jwt')
  })

  it('fetches the current user without changing the saved access token', async () => {
    const response = { id: 1, fullName: 'Alex Morgan', role: 'CUSTOMER' }
    localStorage.setItem(ACCESS_TOKEN_KEY, 'customer-jwt')
    api.get.mockResolvedValue({ data: response })

    await expect(getCurrentUser()).resolves.toEqual(response)
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('customer-jwt')
  })

  it('fetches a CSRF token before logout', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'customer-jwt')
    api.post.mockResolvedValue({ data: { message: 'Logged out' } })

    await expect(logoutUser()).resolves.toEqual({ message: 'Logged out' })
    expect(api.get).toHaveBeenCalledWith('/auth/csrf')
    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
  })
})
