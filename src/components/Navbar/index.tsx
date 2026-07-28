import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Navbar.css'
import savorLogo from '../../assets/savor-logo.svg'
import { useCart } from '../../context/useCart'
import { useWishlist } from '../../context/useWishlist'
import HeartIcon from '../HeartIcon'
const navLinks = [
  { label: 'מטבחים', to: '/catalog' },
  { label: 'כלי תכנון', to: '/configurator' },
  { label: 'מוצרים בודדים', to: '/accessories' },
  { label: 'מוצרים משלמים', to: '/accessories' },
  { label: 'צור קשר', to: '/contact' },
]

const kitchenGroups = [
  { label: 'מטבחים 1.5 מטר' },
  { label: 'מטבחים 2 מטר' },
  { label: 'מטבחים 2.1 מטר' },
  { label: 'מטבחים 2.6 מטר' },
  { label: 'מטבחים 3.2 מטר' },
]

const mobileFlatLinks = navLinks.filter((link) => link.label !== 'מטבחים')

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={open ? 'navbar__chevron navbar__chevron--open' : 'navbar__chevron'}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function Navbar() {
  const { cartItems } = useCart()
  const cartCount = cartItems.length
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const [menuOpen, setMenuOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(['מטבחים']),
  )

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

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
        
        <div className="navbar__wishlist-wrap">
          <button
            type="button"
            className="navbar__icon-btn"
            aria-label="מוצרים שאהבתי"
            aria-expanded={wishlistOpen}
            onClick={() => setWishlistOpen((open) => !open)}
          >
            <HeartIcon filled={wishlistItems.length > 0} />
            {wishlistItems.length > 0 && (
              <span className="navbar__cart-badge">{wishlistItems.length}</span>
            )}
          </button>

          {wishlistOpen && (
            <>
              <div className="navbar__wishlist-backdrop" onClick={() => setWishlistOpen(false)} />
              <div className="navbar__wishlist-panel">
                <h3 className="navbar__wishlist-title">מוצרים שאהבתי</h3>

                {wishlistItems.length === 0 ? (
                  <p className="navbar__wishlist-empty">עדיין לא הוספתם מוצרים לרשימת המועדפים</p>
                ) : (
                  <div className="navbar__wishlist-list">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="navbar__wishlist-item">
                        <button
                          type="button"
                          className="navbar__wishlist-item-heart"
                          aria-label="הסרה מהמועדפים"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <HeartIcon filled />
                        </button>
                        <div className="navbar__wishlist-item-info">
                          <span className="navbar__wishlist-item-name">{item.name}</span>
                          {item.subtitle && (
                            <span className="navbar__wishlist-item-sub">{item.subtitle}</span>
                          )}
                        </div>
                        <span className="navbar__wishlist-item-price">
                          {item.price.toLocaleString()} ₪
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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

      </div>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          <button
            type="button"
            className="navbar__mobile-menu-close"
            aria-label="סגירת תפריט"
            onClick={closeMenu}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#377E2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>

          <div className="navbar__mobile-menu-body">
            <div className="navbar__mobile-group">
              <button
                type="button"
                className="navbar__mobile-group-toggle"
                onClick={() => toggleGroup('מטבחים')}
              >
                <span>מטבחים</span>
                <Chevron open={openGroups.has('מטבחים')} />
              </button>

              {openGroups.has('מטבחים') && (
                <div className="navbar__mobile-subgroup-list">
                  {kitchenGroups.map((group) => (
                    <Link
                      key={group.label}
                      to="/catalog"
                      className="navbar__mobile-subgroup-toggle"
                      onClick={closeMenu}
                    >
                      <span>{group.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {mobileFlatLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="navbar__mobile-flat-link"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar__mobile-menu-footer">
            <img src={savorLogo} alt="Savor Kitchens" />
          </div>
        </div>
      )}
    </nav>
  )
}