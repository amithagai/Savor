import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AdminAuthContext } from './AdminAuthContext'
import { api } from '../lib/api'

const STORAGE_KEY = 'savor:admin_token'

function loadStoredToken(): string | null {
  const sessionToken = sessionStorage.getItem(STORAGE_KEY)
  const legacyToken = localStorage.getItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
  if (!sessionToken && legacyToken) {
    sessionStorage.setItem(STORAGE_KEY, legacyToken)
  }
  return sessionToken || legacyToken
}

type AdminAuthProviderProps = {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [token, setToken] = useState<string | null>(loadStoredToken)

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    localStorage.removeItem(STORAGE_KEY)
  }, [token])

  const login = async (email: string, password: string) => {
    const result = await api.post<{ access_token: string }>('/auth/admin/login', { email, password })
    setToken(result.access_token)
  }

  const logout = () => {
    setToken(null)
  }

  return (
    <AdminAuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
