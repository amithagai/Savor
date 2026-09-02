export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SESSION_TOKEN_STORAGE_KEY = 'savor:session-token'
const LEGACY_SESSION_STORAGE_KEY = 'savor:session-id'
let sessionRequest: Promise<string> | null = null

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function issueSessionToken(): Promise<string> {
  const legacySessionId = localStorage.getItem(LEGACY_SESSION_STORAGE_KEY)
  const res = await fetch(`${API_URL}/auth/session`, {
    method: 'POST',
    headers: legacySessionId ? { 'X-Legacy-Session-Id': legacySessionId } : {},
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.detail || res.statusText)
  }
  const body = await res.json() as { session_token: string }
  if (!body.session_token) {
    throw new ApiError(502, 'The API returned an invalid guest session')
  }
  localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, body.session_token)
  localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
  return body.session_token
}

async function getSessionToken(): Promise<string> {
  const storedToken = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
  if (storedToken) {
    return storedToken
  }
  if (!sessionRequest) {
    sessionRequest = issueSessionToken().finally(() => {
      sessionRequest = null
    })
  }
  return sessionRequest
}

function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
}

function isGuestSessionError(status: number, detail: unknown): boolean {
  return status === 401 && (
    detail === 'Invalid or expired guest session'
    || detail === 'X-Session-Token header is required'
  )
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retryGuestSession = true,
): Promise<T> {
  const sessionToken = await getSessionToken()
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('X-Session-Token', sessionToken)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (retryGuestSession && isGuestSessionError(res.status, body?.detail)) {
      clearSessionToken()
      return request<T>(path, options, token, false)
    }
    throw new ApiError(res.status, body?.detail || res.statusText)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export const api = {
  get: <T,>(path: string, token?: string | null) => request<T>(path, {}, token),
  post: <T,>(path: string, data: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }, token),
  patch: <T,>(path: string, data: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }, token),
  delete: <T,>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE' }, token),
  put: <T,>(path: string, data: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }, token),
  upload: <T,>(path: string, file: File, token?: string | null): Promise<T> => {
    const form = new FormData()
    form.append('file', file)
    return request<T>(path, { method: 'POST', body: form }, token)
  },
}
