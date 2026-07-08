import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Navbar.css'
import savorLogo from '../../assets/savor-logo.svg'
import { useCart } from '../../context/useCart'
const navLinks = [
  { label: 'מטבחים', to: '/catalog' },
  { label: 'כלי תכנון', to: '/configurator' },
  { label: 'מוצרים בודדים', to: '/accessories' },
  { label: 'מוצרים משלמים', to: '/accessories' },
  { label: 'צור קשר', to: '/contact' },
]

export default function Navbar() {
  const { cartItems } = useCart()
  const cartCount = cartItems.length
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        <img src={savorLogo} alt="savorLogo" />
      </Link>

      <ul className="navbar__nav">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
      {/* Left side — hamburger (mobile) + cart + wishlist */}
      <div className="navbar__icons">
        <button
          type="button"
          className="navbar__icon-btn navbar__hamburger"
          aria-label="תפריט"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#377E2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
        <Link to="/cart" className="navbar__icon-btn" aria-label="עגלת קניות">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>

          {cartCount > 0 && (
            <span className="navbar__cart-badge">{cartCount}</span>
          )}
        </Link>

        <Link to="/wishlist" className="navbar__icon-btn" aria-label="רשימת מועדפים">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </Link>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <ul className="navbar__mobile-nav">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link to={link.to} onClick={() => setMenuOpen(false)}>{link.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}