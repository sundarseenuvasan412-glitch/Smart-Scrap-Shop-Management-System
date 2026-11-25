// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { ACCESS_TOKEN_KEY } from './authToken'

const originalAdapter = api.defaults.adapter
const onSessionExpired = vi.fn()

afterEach(() => {
  api.defaults.adapter = originalAdapter
  localStorage.clear()
  window.removeEventListener('scrapworld:session-expired', onSessionExpired)
  onSessionExpired.mockClear()
})

describe('API session handling', () => {
  it('notifies the app when a protected API request returns 401', async () => {
    let authorizationHeader
    localStorage.setItem(ACCESS_TOKEN_KEY, 'test-access-token')
    api.defaults.adapter = (config) => {
      authorizationHeader = config.headers.Authorization
      return Promise.reject({ config, response: { status: 401, config } })
    }
    window.addEventListener('scrapworld:session-expired', onSessionExpired)

    await expect(api.get('/admin/orders')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(onSessionExpired).toHaveBeenCalledOnce()
    expect(authorizationHeader).toBe('Bearer test-access-token')
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
  })

  it('does not expire the session for invalid login credentials', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'existing-token')
    api.defaults.adapter = (config) => {
      expect(config.headers.Authorization).toBe('Bearer existing-token')
      return Promise.reject({ config, response: { status: 401, config } })
    }
    window.addEventListener('scrapworld:session-expired', onSessionExpired)

    await expect(api.post('/auth/admin/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(onSessionExpired).not.toHaveBeenCalled()
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('existing-token')
  })
})
