import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import './AdminLogin.css'
import savorLogo from '../../assets/savor-logo.svg'
import { ApiError } from '../../lib/api'
import { useAdminAuth } from '../../context/useAdminAuth'

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/admin/orders" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/orders')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('אימייל או סיסמה שגויים')
      } else {
        setError('אירעה שגיאה, נסו שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <img src={savorLogo} alt="Savor Kitchens" />
        </div>
        <h1 className="admin-login__title">כניסת מנהלים</h1>

        <form onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="admin-login__field">
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="admin-login__error">{error}</p>}

          <button type="submit" className="admin-login__submit" disabled={loading}>
            {loading ? 'מתחבר…' : 'התחברות'}
          </button>
        </form>
      </div>
    </div>
  )
}
