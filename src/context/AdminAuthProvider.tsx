import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AdminAuthContext } from './AdminAuthContext'
import type { AdminLoginResult, AdminMfaSetup } from './AdminAuthContext'
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

  const login = async (email: string, password: string): Promise<AdminLoginResult> => {
    const result = await api.post<{
      access_token?: string
      status?: 'mfa_required' | 'mfa_setup_required'
      challenge_token?: string
      setup_token?: string
    }>('/auth/admin/login', { email, password })

    if (result.access_token) {
      setToken(result.access_token)
      return { status: 'authenticated' }
    }
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
    const result = await api.post<{ access_token: string; recovery_codes: string[] }>(
      '/auth/admin/mfa/confirm',
      { setup_token: setupToken, code },
    )
    setToken(result.access_token)
    return result.recovery_codes
  }

  const verifyMfa = async (challengeToken: string, code: string): Promise<void> => {
    const result = await api.post<{ access_token: string }>(
      '/auth/admin/mfa/verify',
      { challenge_token: challengeToken, code },
    )
    setToken(result.access_token)
  }

  const logout = () => {
    setToken(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, startMfaSetup, confirmMfaSetup, verifyMfa, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
