import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import './AdminLayout.css'
import savorLogo from '../../assets/savor-logo.png'
import { ApiError, api } from '../../lib/api'
import { adminLoginPath } from '../../lib/adminRoutes'
import { useAdminAuth } from '../../context/useAdminAuth'

export default function AdminLayout() {
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(adminLoginPath())
  }

  const closePasswordDialog = () => {
    if (passwordLoading) return
    setPasswordDialogOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError('')

    if (newPassword.length < 12) {
      setPasswordError('הסיסמה החדשה חייבת להכיל לפחות 12 תווים')
      return
    }
    if (!/\p{L}/u.test(newPassword) || !/\p{N}/u.test(newPassword)) {
      setPasswordError('הסיסמה החדשה חייבת לכלול לפחות אות אחת ומספר אחד')
      return
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setPasswordError('הסיסמה החדשה ארוכה מדי')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('אימות הסיסמה החדשה אינו תואם')
      return
    }

    setPasswordLoading(true)
    try {
      await api.patch<void>(
        '/auth/admin/password',
        { current_password: currentPassword, new_password: newPassword },
        token,
      )
      logout()
      navigate(adminLoginPath('?password_changed=1'), { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setPasswordError('הסיסמה הנוכחית שהוזנה אינה נכונה')
      } else if (error instanceof ApiError && error.status === 422) {
        setPasswordError('הסיסמה החדשה אינה עומדת בדרישות')
      } else if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        logout()
        navigate(adminLoginPath(), { replace: true })
      } else {
        setPasswordError('לא הצלחנו לשנות את הסיסמה. נסו שוב')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'admin__nav-link--active' : undefined

  return (
    <div className="admin">
      <header className="admin__topbar">
        <div className="admin__brand">
          <img src={savorLogo} alt="Savor Kitchens" />
          <span>אזור ניהול</span>
        </div>

        <ul className="admin__nav">
          <li>
            <NavLink to="/admin/products" className={navLinkClass}>
              מוצרים
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/orders" className={navLinkClass}>
              הזמנות
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/content" className={navLinkClass}>
              תוכן האתר
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/prices" className={navLinkClass}>
              מחירים
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/inventory" className={navLinkClass}>
              מלאי
            </NavLink>
          </li>
        </ul>

        <div className="admin__account-actions">
          <a
            className="admin__guide-link"
            href="/docs/Savor_Manager_Guide_HE.docx"
            download
          >
            מדריך למנהלת
          </a>
          <button
            type="button"
            className="admin__password-button"
            onClick={() => setPasswordDialogOpen(true)}
          >
            שינוי סיסמה
          </button>
          <button type="button" className="admin__logout" onClick={handleLogout}>
            התנתקות
          </button>
        </div>
      </header>

      <main className="admin__content">
        <Outlet />
      </main>

      {passwordDialogOpen && (
        <div className="admin-password__backdrop" onMouseDown={closePasswordDialog}>
          <section
            className="admin-password__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-password-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-password__close"
              onClick={closePasswordDialog}
              aria-label="סגירת החלון"
              disabled={passwordLoading}
            >
              ×
            </button>
            <h2 id="admin-password-title">שינוי סיסמה</h2>
            <p className="admin-password__intro">
              לאחר השינוי תתבצע התנתקות, ויהיה צורך להתחבר עם הסיסמה החדשה.
            </p>

            <form onSubmit={handlePasswordChange}>
              <label>
                סיסמה נוכחית
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </label>
              <label>
                סיסמה חדשה
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </label>
              <p className="admin-password__hint">לפחות 12 תווים, כולל אות ומספר</p>
              <label>
                אימות סיסמה חדשה
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </label>

              {passwordError && (
                <p className="admin-password__error" role="alert">
                  {passwordError}
                </p>
              )}

              <div className="admin-password__actions">
                <button type="button" onClick={closePasswordDialog} disabled={passwordLoading}>
                  ביטול
                </button>
                <button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'שומרת…' : 'שמירת סיסמה'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
