import { createContext } from 'react'

export type AdminAuthContextType = {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AdminLoginResult>
  startMfaSetup: (setupToken: string) => Promise<AdminMfaSetup>
  confirmMfaSetup: (setupToken: string, code: string) => Promise<string[]>
  verifyMfa: (challengeToken: string, code: string) => Promise<void>
  logout: () => void
}

export type AdminLoginResult =
  | { status: 'authenticated' }
  | { status: 'mfa_required'; challengeToken: string }
  | { status: 'mfa_setup_required'; setupToken: string }

export type AdminMfaSetup = {
  secret: string
  otpauthUri: string
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
