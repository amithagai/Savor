export const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000')
let sessionRequest: Promise<void> | null = null
let sessionGeneration = 0

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function issueSessionCookie(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/session`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.detail || res.statusText)
  }
}

async function refreshSessionCookie(observedGeneration: number): Promise<void> {
  if (observedGeneration !== sessionGeneration) {
    return
  }
  if (!sessionRequest) {
    sessionRequest = issueSessionCookie()
      .then(() => {
        sessionGeneration += 1
      })
      .finally(() => {
        sessionRequest = null
      })
  }
  return sessionRequest
}

function isGuestSessionError(status: number, detail: unknown): boolean {
  return status === 401 && (
    detail === 'Invalid or expired guest session'
    || detail === 'Guest session cookie is required'
  )
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retryGuestSession = true,
): Promise<T> {
  const observedSessionGeneration = sessionGeneration
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (retryGuestSession && isGuestSessionError(res.status, body?.detail)) {
      await refreshSessionCookie(observedSessionGeneration)
      return request<T>(path, options, false)
    }
    throw new ApiError(res.status, body?.detail || res.statusText)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T,>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T,>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
  put: <T,>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  upload: <T,>(path: string, file: File): Promise<T> => {
    const form = new FormData()
    form.append('file', file)
    return request<T>(path, { method: 'POST', body: form })
  },
}
