import './Footer.css'
import savorLogo from '../../assets/savor-logo.svg'
import instagramIcon from '../../assets/instagram.svg'
import whatsappIcon from '../../assets/whatsapp.svg'
import { EmnailInput } from '../Input/EmailInput'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

  const accepted = "accepted"
  const dismiss = "dismiss"
  

  const saved_cookie_value = localStorage.getItem("has_accepted_cookie")
  const has_selected_cookie = ((saved_cookie_value === accepted) || saved_cookie_value === dismiss)

export default function Footer() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [cookieDismissed, setCookieDismissed] = useState(() => has_selected_cookie)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const isHomeScreen = location.pathname ===  "/"
  
  const handleAcceptClick = () => { 
    localStorage.setItem("has_accepted_cookie", accepted)
     setCookieDismissed(true)
   }
   const handleDeclineClick = () => {
     localStorage.setItem("has_accepted_cookie", dismiss)
      setCookieDismissed(true)
   }
  return (
    <>
      <footer className="footer">
        <div className="footer__main">
          {/* Logo — rightmost in RTL */}
          <div>
            <div className="footer__logo">
              <img src={savorLogo} alt="Savor Kitchens" />
            </div>
          </div>

          {/* תוכן והדרכה */}
          <div className="footer__col">
            <p className="footer__col-title">תוכן והדרכה</p>
            <ul>
              <li><a href="/about">מי אנחנו</a></li>
              <li><a href="/size-guide">מדריך ללקיחת מידה</a></li>
              <li><a href="#">חוברות הרכבה</a></li>
            </ul>
          </div>

          {/* שירות לקוחות */}
          <div className="footer__col">
            <p className="footer__col-title">שירות לקוחות</p>
            <ul>
              <li><a href="/contact">צור קשר</a></li>
              <li className="footer__hours">
                <span className="footer__col-detail">
                  <span className="footer__hours-days">שעות פעילות: ימי א׳ - ה׳</span>{' '}
                  <span className="footer__hours-time">08:00 - 16:00</span>
                </span>
              </li>
              <li>
                <span className="footer__col-detail">
                  כתובת לאיסוף עצמי: מומנטום - שדרות טום לנטוס 10, נתניה
                </span>
              </li>
              <li><a href="/warranty">מדיניות אחריות והחזרה</a></li>
            </ul>
          </div>

          {/* דברו איתנו — leftmost in RTL */}
          <div>
            <div className="footer__social-row">
              <p className="footer__social-title">דברו איתנו</p>
              <div className="footer__social-icons">
                <a href="#" className="footer__social-link" aria-label="Instagram">
                  <img src={instagramIcon} alt="" />
                </a>
                <a href="https://wa.me/972509072335" className="footer__social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                  <img src={whatsappIcon} alt="" />
                </a>
              </div>
            </div>
            <div className="footer__email-row">
              <EmnailInput handleChange={handleChange} email={email} />
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 כל הזכויות שמורות לסאבור מטבחים</span>
          <a href="/admin/login" className="footer__admin-link">כניסת מנהלים</a>
        </div>
      </footer>

      {/* WhatsApp floating action button */}
      {isHomeScreen && ( 
      <a href="https://wa.me/972509072335" className="whatsapp-fab" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      )
      }
      {!cookieDismissed && (
        <div className="cookie-banner">
          <div className="cookie-banner__icon">🍪</div>
          <div className="cookie-banner__body">
            <p>
              אתר זה משתמש בקוקיז כדי להבטיח את החוויה הטובה ביותר. אנו
              משתמשים בהם לצרכי פעולה האתר, ניתוח סטטיסטי והתאמת פרסומות.{' '}
              <a href="/warranty" className="cookie-banner__link">
                מדיניות הפרטיות
              </a>
              .
            </p>
            <div className="cookie-banner__actions">
              <button
                className="cookie-banner__accept"
                onClick={handleAcceptClick}
              >
                אני מסכים
              </button>
              <button
                className="cookie-banner__dismiss"
                onClick={handleDeclineClick}
              >
                דחייה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
