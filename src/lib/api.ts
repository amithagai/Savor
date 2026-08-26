export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SESSION_STORAGE_KEY = 'savor:session-id'

function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSessionId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
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
  upload: async <T,>(path: string, file: File, token?: string | null): Promise<T> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'X-Session-Id': getSessionId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new ApiError(res.status, body?.detail || res.statusText)
    }
    return res.json()
  },
}
