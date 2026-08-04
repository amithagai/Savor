import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import './AdminLayout.css'
import savorLogo from '../../assets/savor-logo.png'
import { useAdminAuth } from '../../context/useAdminAuth'

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
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
        </ul>

        <button type="button" className="admin__logout" onClick={handleLogout}>
          התנתקות
        </button>
      </header>

      <main className="admin__content">
        <Outlet />
      </main>
    </div>
  )
}
