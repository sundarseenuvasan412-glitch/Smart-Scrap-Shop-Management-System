import api from './api'
import { clearAccessToken, saveAccessToken } from './authToken'

async function prepareCsrfToken() {
  await api.get('/auth/csrf')
}

function persistToken(response) {
  if (typeof response.token !== 'string' || !response.token) {
    throw new Error('The sign-in response did not include an access token.')
  }
  saveAccessToken(response.token)
}

export async function registerUser(details) {
  await prepareCsrfToken()
  const response = await api.post('/auth/register', details)
  return response.data
}

export async function loginUser(credentials) {
  await prepareCsrfToken()
  const response = await api.post('/auth/login', credentials)
  persistToken(response.data)
  return response.data
}

export async function loginAdmin(credentials) {
  await prepareCsrfToken()
  const response = await api.post('/auth/admin/login', credentials)
  persistToken(response.data)
  return response.data
}

export async function logoutUser() {
  await prepareCsrfToken()
  const response = await api.post('/auth/logout')
  clearAccessToken()
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}
