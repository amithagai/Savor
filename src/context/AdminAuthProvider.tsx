import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AdminAuthContext } from './AdminAuthContext'
import { api } from '../lib/api'

const STORAGE_KEY = 'savor:admin_token'

function loadStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

type AdminAuthProviderProps = {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [token, setToken] = useState<string | null>(loadStoredToken)

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
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
