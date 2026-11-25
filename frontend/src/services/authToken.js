export const ACCESS_TOKEN_KEY = 'scrapworld_access_token'

export function getAccessToken() {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function saveAccessToken(token) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function clearAccessToken() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}
