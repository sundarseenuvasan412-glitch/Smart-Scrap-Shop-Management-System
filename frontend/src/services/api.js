import axios from 'axios'
import { clearAccessToken, getAccessToken } from './authToken'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
})

const publicAuthEndpoints = [
  '/auth/csrf',
  '/auth/login',
  '/auth/admin/login',
  '/auth/register',
  '/auth/me',
]

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isPublicAuthRequest = publicAuthEndpoints.some((endpoint) => requestUrl.endsWith(endpoint))
    if (error.response?.status === 401) {
      const isLoginRequest = requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/admin/login')
      if (!isLoginRequest) {
        clearAccessToken()
      }
      if (!isPublicAuthRequest && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scrapworld:session-expired'))
      }
    }
    return Promise.reject(error)
  },
)

export default api
