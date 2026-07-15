const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
}
