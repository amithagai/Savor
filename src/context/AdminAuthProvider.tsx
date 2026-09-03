import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AdminAuthContext } from './AdminAuthContext'
import type { AdminLoginResult, AdminMfaSetup } from './AdminAuthContext'
import { api } from '../lib/api'

const LEGACY_STORAGE_KEY = 'savor:admin_token'

type AdminAuthProviderProps = {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)

    let cancelled = false
    api.get<{ authenticated: true }>('/auth/admin/session')
      .then(() => {
        if (!cancelled) setIsAuthenticated(true)
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string): Promise<AdminLoginResult> => {
    const result = await api.post<{
      status?: 'mfa_required' | 'mfa_setup_required'
      challenge_token?: string
      setup_token?: string
    }>('/auth/admin/login', { email, password })

    if (result.status === 'mfa_required' && result.challenge_token) {
      return { status: 'mfa_required', challengeToken: result.challenge_token }
    }
    if (result.status === 'mfa_setup_required' && result.setup_token) {
      return { status: 'mfa_setup_required', setupToken: result.setup_token }
    }
    throw new Error('The API returned an invalid admin authentication response')
  }

  const startMfaSetup = async (setupToken: string): Promise<AdminMfaSetup> => {
    const result = await api.post<{ secret: string; otpauth_uri: string }>(
      '/auth/admin/mfa/setup',
      { setup_token: setupToken },
    )
    return { secret: result.secret, otpauthUri: result.otpauth_uri }
  }

  const confirmMfaSetup = async (setupToken: string, code: string): Promise<string[]> => {
    const result = await api.post<{ authenticated: true; recovery_codes: string[] }>(
      '/auth/admin/mfa/confirm',
      { setup_token: setupToken, code },
    )
    setIsAuthenticated(true)
    return result.recovery_codes
  }

  const verifyMfa = async (challengeToken: string, code: string): Promise<void> => {
    await api.post<{ authenticated: true }>(
      '/auth/admin/mfa/verify',
      { challenge_token: challengeToken, code },
    )
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await api.post<void>('/auth/admin/logout', {})
    } finally {
      setIsAuthenticated(false)
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, isLoading, login, startMfaSetup, confirmMfaSetup, verifyMfa, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
