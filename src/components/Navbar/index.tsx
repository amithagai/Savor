import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'
import savorLogo from '../../assets/savor-logo.png'
import { useCart } from '../../context/useCart'
import { useWishlist } from '../../context/useWishlist'
import HeartIcon from '../HeartIcon'

const navLinks = [
  { label: 'מטבחים', to: '/catalog' },
  { label: 'כלי תכנון', to: '/configurator' },
  { label: 'מוצרים בודדים', to: '/single-products' },
  { label: 'מוצרים משלימים', to: '/accessories' },
  { label: 'צור קשר', to: '/contact' },
]

const kitchenGroups = [
  { label: 'מטבחים 1.5 מטר', to: '/catalog?size=1.5%20מטר' },
  { label: 'מטבחים 2 מטר', to: '/catalog?size=2%20מטר' },
  { label: 'מטבחים 2.1 מטר', to: '/catalog?size=2.1%20מטר' },
  { label: 'מטבחים 2.6 מטר', to: '/catalog?size=2.6%20מטר' },
  { label: 'מטבחים 3.2 מטר', to: '/catalog?size=3.2%20מטר' },
  { label: 'מטבחים פינתיים', to: '/catalog?layout=corner' },
]

const mobileFlatLinks = navLinks.filter((link) => link.label !== 'מטבחים')
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function keepFocusInside(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== 'Tab' || !container) return

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => element.getClientRects().length > 0)

  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)
  if (!firstElement || !lastElement) return

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function isCurrentKitchenGroup(pathname: string, search: string, destination: string) {
  const [destinationPath, destinationSearch = ''] = destination.split('?')
  if (pathname !== destinationPath) return false

  const currentParams = new URLSearchParams(search)
  const destinationParams = new URLSearchParams(destinationSearch)
  return Array.from(destinationParams).every(
    ([key, value]) => currentParams.get(key) === value,
  )
}

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
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function Navbar() {
  const location = useLocation()
  const { cartItems } = useCart()
  const cartCount = cartItems.length
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(['מטבחים']),
  )
  const desktopMenuButtonRef = useRef<HTMLButtonElement>(null)
  const desktopMenuRef = useRef<HTMLUListElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuCloseRef = useRef<HTMLButtonElement>(null)
  const wishlistButtonRef = useRef<HTMLButtonElement>(null)
  const wishlistPanelRef = useRef<HTMLDivElement>(null)
  const wishlistCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen && !wishlistOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen, wishlistOpen])

  useEffect(() => {
    if (!menuOpen) return

    mobileMenuCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
        return
      }
      keepFocusInside(event, mobileMenuRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!wishlistOpen) return

    wishlistCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setWishlistOpen(false)
        window.requestAnimationFrame(() => wishlistButtonRef.current?.focus())
        return
      }
      keepFocusInside(event, wishlistPanelRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [wishlistOpen])

  const closeMenu = (restoreFocus = true) => {
    setMenuOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
    }
  }

  const closeWishlist = (restoreFocus = true) => {
    setWishlistOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => wishlistButtonRef.current?.focus())
    }
  }

  const toggleGroup = (key: string) => {
    setOpenGroups((previousGroups) => {
      const nextGroups = new Set(previousGroups)
      if (nextGroups.has(key)) {
        nextGroups.delete(key)
      } else {
        nextGroups.add(key)
      }
      return nextGroups
    })
  }

  const removeWishlistItem = (itemId: string) => {
    removeFromWishlist(itemId)
    window.requestAnimationFrame(() => {
      const nextRemoveButton = wishlistPanelRef.current?.querySelector<HTMLButtonElement>(
        '.navbar__wishlist-item-heart',
      )
      const nextFocusTarget = nextRemoveButton ?? wishlistCloseRef.current
      nextFocusTarget?.focus()
    })
  }

  const handleDesktopMenuKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== 'Escape') return

    event.preventDefault()
    setDesktopMenuOpen(false)
    desktopMenuButtonRef.current?.focus()
  }

  const focusFirstKitchenLink = () => {
    setDesktopMenuOpen(true)
    window.requestAnimationFrame(() => {
      desktopMenuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    })
  }

  return (
    <nav className="navbar" aria-label="ניווט ראשי">
      <Link to="/" className="navbar__logo" aria-label="Savor Kitchens — דף הבית">
        <img src={savorLogo} alt="" />
      </Link>

      <ul className="navbar__nav">
        {navLinks.map((link) =>
          link.label === 'מטבחים' ? (
            <li
              key={link.label}
              className={`navbar__nav-item navbar__nav-item--kitchens${desktopMenuOpen ? ' navbar__nav-item--open' : ''}`}
              onMouseEnter={() => setDesktopMenuOpen(true)}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) {
                  setDesktopMenuOpen(false)
                }
              }}
              onFocus={(event) => {
                const previousTarget = event.relatedTarget
                if (!(previousTarget instanceof Node) || !event.currentTarget.contains(previousTarget)) {
                  setDesktopMenuOpen(true)
                }
              }}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                  setDesktopMenuOpen(false)
                }
              }}
              onKeyDown={handleDesktopMenuKeyDown}
            >
              <div className="navbar__kitchens-trigger">
                <Link
                  to={link.to}
                  className="navbar__nav-link navbar__nav-link--kitchens"
                  aria-current={location.pathname === link.to ? 'page' : undefined}
                  onClick={() => setDesktopMenuOpen(false)}
                >
                  {link.label}
                </Link>
                <button
                  ref={desktopMenuButtonRef}
                  type="button"
                  className="navbar__kitchens-toggle"
                  aria-label="פתיחת תפריט מטבחים לפי מידה"
                  aria-expanded={desktopMenuOpen}
                  aria-controls="desktop-kitchens-menu"
                  onClick={() => setDesktopMenuOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusFirstKitchenLink()
                    }
                  }}
                >
                  <Chevron open={desktopMenuOpen} />
                </button>
              </div>

              <ul
                ref={desktopMenuRef}
                id="desktop-kitchens-menu"
                className="navbar__kitchens-menu"
                aria-label="מטבחים לפי מידה"
              >
                {kitchenGroups.map((group) => (
                  <li key={group.label}>
                    <Link
                      to={group.to}
                      className="navbar__kitchens-menu-link"
                      aria-current={isCurrentKitchenGroup(location.pathname, location.search, group.to) ? 'page' : undefined}
                      onClick={() => setDesktopMenuOpen(false)}
                    >
                      {group.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <li key={link.label} className="navbar__nav-item">
              <Link
                to={link.to}
                className="navbar__nav-link"
                aria-current={location.pathname === link.to ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>

      <div className="navbar__icons">
        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="navbar__icon-btn navbar__hamburger"
          aria-label={menuOpen ? 'סגירת תפריט הניווט' : 'פתיחת תפריט הניווט'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-dialog"
          onClick={() => {
            const willOpen = !menuOpen
            setMenuOpen(willOpen)
            if (willOpen) setWishlistOpen(false)
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#377E2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
            ref={wishlistButtonRef}
            type="button"
            className="navbar__icon-btn"
            aria-label={wishlistItems.length > 0 ? `מוצרים שאהבתי, ${wishlistItems.length} פריטים` : 'מוצרים שאהבתי, הרשימה ריקה'}
            aria-haspopup="dialog"
            aria-expanded={wishlistOpen}
            aria-controls="wishlist-dialog"
            onClick={() => {
              const willOpen = !wishlistOpen
              setWishlistOpen(willOpen)
              if (willOpen) setMenuOpen(false)
            }}
          >
            <HeartIcon filled={wishlistItems.length > 0} />
            {wishlistItems.length > 0 ? (
              <span className="navbar__wishlist-count" aria-hidden="true">
                {wishlistItems.length}
              </span>
            ) : null}
          </button>

          {wishlistOpen ? (
            <>
              <div
                className="navbar__wishlist-backdrop"
                aria-hidden="true"
                onClick={() => closeWishlist()}
              />
              <div
                ref={wishlistPanelRef}
                id="wishlist-dialog"
                className="navbar__wishlist-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wishlist-dialog-title"
              >
                <div className="navbar__wishlist-header">
                  <h2 id="wishlist-dialog-title" className="navbar__wishlist-title">
                    מוצרים שאהבתי
                  </h2>
                  <button
                    ref={wishlistCloseRef}
                    type="button"
                    className="navbar__wishlist-close"
                    aria-label="סגירת רשימת המועדפים"
                    onClick={() => closeWishlist()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false">
                      <line x1="5" y1="5" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="5" y2="19" />
                    </svg>
                  </button>
                </div>

                {wishlistItems.length === 0 ? (
                  <p className="navbar__wishlist-empty">עדיין לא הוספתם מוצרים לרשימת המועדפים</p>
                ) : (
                  <div className="navbar__wishlist-list">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="navbar__wishlist-item">
                        <button
                          type="button"
                          className="navbar__wishlist-item-heart"
                          aria-label={`הסרת ${item.name} מהמועדפים`}
                          onClick={() => removeWishlistItem(item.id)}
                        >
                          <HeartIcon filled />
                        </button>
                        <div className="navbar__wishlist-item-info">
                          <span className="navbar__wishlist-item-name">{item.name}</span>
                          {item.subtitle ? (
                            <span className="navbar__wishlist-item-sub">{item.subtitle}</span>
                          ) : null}
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
          ) : null}
        </div>

        <Link
          to="/cart"
          className="navbar__icon-btn"
          aria-label={cartCount > 0 ? `עגלת קניות, ${cartCount} פריטים` : 'עגלת קניות, העגלה ריקה'}
          aria-current={location.pathname === '/cart' ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>

          {cartCount > 0 ? (
            <span className="navbar__cart-badge" aria-hidden="true">{cartCount}</span>
          ) : null}
        </Link>
      </div>

      {menuOpen ? (
        <div
          ref={mobileMenuRef}
          id="mobile-navigation-dialog"
          className="navbar__mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
        >
          <h2 id="mobile-navigation-title" className="navbar__visually-hidden">
            תפריט ניווט
          </h2>
          <button
            ref={mobileMenuCloseRef}
            type="button"
            className="navbar__mobile-menu-close"
            aria-label="סגירת תפריט הניווט"
            onClick={() => closeMenu()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#377E2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>

          <div className="navbar__mobile-menu-body">
            <div className="navbar__mobile-group">
              <button
                type="button"
                className="navbar__mobile-group-toggle"
                aria-expanded={openGroups.has('מטבחים')}
                aria-controls="mobile-kitchens-group"
                onClick={() => toggleGroup('מטבחים')}
              >
                <span>מטבחים</span>
                <Chevron open={openGroups.has('מטבחים')} />
              </button>

              {openGroups.has('מטבחים') ? (
                <div id="mobile-kitchens-group" className="navbar__mobile-subgroup-list">
                  {kitchenGroups.map((group) => (
                    <Link
                      key={group.label}
                      to={group.to}
                      className="navbar__mobile-subgroup-toggle"
                      aria-current={isCurrentKitchenGroup(location.pathname, location.search, group.to) ? 'page' : undefined}
                      onClick={() => closeMenu(false)}
                    >
                      <span>{group.label}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {mobileFlatLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="navbar__mobile-flat-link"
                aria-current={location.pathname === link.to ? 'page' : undefined}
                onClick={() => closeMenu(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar__mobile-menu-footer">
            <img src={savorLogo} alt="" />
          </div>
        </div>
      ) : null}
    </nav>
  )
}
