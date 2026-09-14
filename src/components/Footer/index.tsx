import './Footer.css'
import savorLogo from '../../assets/savor-logo.png'
import instagramIcon from '../../assets/instagram.svg'
import whatsappIcon from '../../assets/whatsapp.svg'
import { EmailInput } from '../Input/EmailInput'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteContent } from '../../hooks/useSiteContent'
import type { FooterContent } from '../../types/content'

const ACCEPTED_COOKIE_VALUE = 'accepted'
const DISMISSED_COOKIE_VALUE = 'dismiss'
const COOKIE_STORAGE_KEY = 'has_accepted_cookie'

function hasSavedCookieChoice() {
  try {
    const savedValue = localStorage.getItem(COOKIE_STORAGE_KEY)
    return savedValue === ACCEPTED_COOKIE_VALUE || savedValue === DISMISSED_COOKIE_VALUE
  } catch {
    return false
  }
}

export default function Footer() {
  const { data: content } = useSiteContent<FooterContent>('footer')
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [cookieDismissed, setCookieDismissed] = useState(hasSavedCookieChoice)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)
  const isHomeScreen = location.pathname === '/'

  const saveCookieChoice = (value: string) => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, value)
    } catch {
      // The choice still applies for this visit when storage is unavailable.
    }
    setCookieDismissed(true)
  }

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }
  return (
    <>
      <footer className="footer" aria-label="מידע וקישורים נוספים">
        <div className="footer__inner">
          <div className="footer__main">
          {/* Logo — rightmost in RTL */}
          <div>
            <div className="footer__logo">
              <img src={savorLogo} alt="Savor Kitchens" />
            </div>
          </div>

          {/* תוכן והדרכה */}
          <div className="footer__col">
            <h2 className="footer__col-title">{content?.content_title || 'תוכן והדרכה'}</h2>
            <ul>
              <li><Link to="/about">מי אנחנו</Link></li>
              <li><Link to="/size-guide">מדריך ללקיחת מידה</Link></li>
              <li><Link to="/assembly-guides">חוברות הרכבה</Link></li>
            </ul>
          </div>

          {/* שירות לקוחות */}
          <div className="footer__col">
            <h2 className="footer__col-title">{content?.service_title || 'שירות לקוחות'}</h2>
            <ul>
              <li><Link to="/contact">צור קשר</Link></li>
              <li className="footer__hours">
                <span className="footer__col-detail">
                  <span className="footer__hours-days">{content?.hours || 'שעות פעילות: ימי א׳ - ה׳ 08:00 - 16:00'}</span>
                </span>
              </li>
              <li>
                <span className="footer__col-detail">
                  {content?.pickup_address || 'כתובת לאיסוף עצמי: מומנטום - שדרות טום לנטוס 10, נתניה'}
                </span>
              </li>
              <li><Link to="/warranty">מדיניות אחריות והחזרה</Link></li>
              <li><Link to="/terms">תנאי השימוש</Link></li>
            </ul>
          </div>

          {/* דברו איתנו — leftmost in RTL */}
          <div>
            <div className="footer__social-row">
              <h2 className="footer__social-title">{content?.contact_title || 'דברו איתנו'}</h2>
              <div className="footer__social-icons">
                <a href={content?.instagram_url || '#'} className="footer__social-link" aria-label="Instagram">
                  <img src={instagramIcon} alt="" />
                </a>
                <a href={content?.whatsapp_url || 'https://wa.me/972509072335'} className="footer__social-link" aria-label="פתיחת WhatsApp בלשונית חדשה" target="_blank" rel="noopener noreferrer">
                  <img src={whatsappIcon} alt="" />
                </a>
              </div>
            </div>
            <form className="footer__email-row" aria-label="הרשמה לניוזלטר" onSubmit={handleNewsletterSubmit}>
              <EmailInput
                id="footer-newsletter-email"
                label="כתובת אימייל להרשמה לניוזלטר"
                handleChange={handleChange}
                email={email}
              />
            </form>
          </div>
          </div>

          <div className="footer__bottom">
            <span>{content?.copyright || '© 2026 כל הזכויות שמורות לסאבור מטבחים'}</span>
            <Link className="footer__accessibility-link" to="/accessibility">הצהרת נגישות</Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating action button */}
      {isHomeScreen && ( 
      <a href={content?.whatsapp_url || 'https://wa.me/972509072335'} className="whatsapp-fab" aria-label="פתיחת WhatsApp בלשונית חדשה" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      )
      }
      {!cookieDismissed && (
        <section className="cookie-banner" aria-labelledby="cookie-banner-title">
          <h2 id="cookie-banner-title" className="visually-hidden">העדפות עוגיות</h2>
          <div className="cookie-banner__icon" aria-hidden="true">🍪</div>
          <div className="cookie-banner__body">
            <p>
              אתר זה משתמש בקוקיז כדי להבטיח את החוויה הטובה ביותר. אנו
              משתמשים בהם לצרכי פעולה האתר, ניתוח סטטיסטי והתאמת פרסומות.{' '}
              <Link to="/warranty" className="cookie-banner__link">
                מדיניות הפרטיות
              </Link>
              .
            </p>
            <div className="cookie-banner__actions">
              <button
                type="button"
                className="cookie-banner__accept"
                onClick={() => saveCookieChoice(ACCEPTED_COOKIE_VALUE)}
              >
                אני מסכים
              </button>
              <button
                type="button"
                className="cookie-banner__dismiss"
                onClick={() => saveCookieChoice(DISMISSED_COOKIE_VALUE)}
              >
                דחייה
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
