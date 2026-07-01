import { Link } from 'react-router-dom'
import './Navbar.css'
import savorLogo from '../../assets/savor-logo.svg'

const navLinks = [
  { label: 'מטבחים', to: '/catalog' },
  { label: 'כלי תכנון', to: '/configurator' },
  { label: 'מוצרים בודדים', to: '/accessories' },
  { label: 'מוצרים משלמים', to: '/accessories' },
  { label: 'צור קשר', to: '/contact' },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Right side — logo */}
      <Link to="/" className="navbar__logo">
        {/* Sav<span className="navbar__logo-tag">KITCHENS</span>or */}
        <img src={savorLogo} alt="savorLogo" />
      </Link>

      {/* Center nav */}
      <ul className="navbar__nav">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
      {/* Left side — cart + wishlist */}
      <div className="navbar__icons">
        <Link to="/cart" className="navbar__icon-btn" aria-label="עגלת קניות">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </Link>
        <Link to="/wishlist" className="navbar__icon-btn" aria-label="רשימת מועדפים">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </Link>
      </div>
    </nav>
  )
}
