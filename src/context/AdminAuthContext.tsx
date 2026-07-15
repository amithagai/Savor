import { createContext } from 'react'

export type AdminAuthContextType = {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
