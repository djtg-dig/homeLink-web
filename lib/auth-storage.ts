export const AUTH_ACCESS_TOKEN_STORAGE_KEY = "homelink.access_token"
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = "homelink.refresh_token"
export const AUTH_TOKEN_SCHEME_STORAGE_KEY = "homelink.token_scheme"
export const AUTH_STORAGE_EVENT = "homelink-auth-changed"

type StoredAuthTokens = {
  accessToken: string
  refreshToken?: string
  scheme?: string
}

function storageAvailable() {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

export function storeAuthTokens({
  accessToken,
  refreshToken,
  scheme = "Bearer",
}: StoredAuthTokens) {
  if (!storageAvailable()) {
    return
  }

  window.localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, accessToken)
  window.localStorage.setItem(AUTH_TOKEN_SCHEME_STORAGE_KEY, scheme)

  if (refreshToken) {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  } else {
    window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}

export function getStoredAccessToken() {
  if (!storageAvailable()) {
    return null
  }

  return window.localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)
}

export function getStoredRefreshToken() {
  if (!storageAvailable()) {
    return null
  }

  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)
}

export function getStoredTokenScheme() {
  if (!storageAvailable()) {
    return "Bearer"
  }

  return window.localStorage.getItem(AUTH_TOKEN_SCHEME_STORAGE_KEY) ?? "Bearer"
}

export function getStoredAuthorizationHeader() {
  const token = getStoredAccessToken()

  return token ? `${getStoredTokenScheme()} ${token}` : null
}

export function clearStoredAuthTokens() {
  if (!storageAvailable()) {
    return
  }

  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_TOKEN_SCHEME_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT))
}
