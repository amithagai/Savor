import { Link } from 'react-router-dom'
import { useState } from 'react'
import heroBg from '../../../assets/hero-bg.svg'
import AnnouncementBar from './AnnouncementBar'

export default function HeroSection() {
  const [cookieDismissed, setCookieDismissed] = useState(false)

  return (
    <section className="hero">
      <div className="hero__image" style={{ backgroundImage: `url(${heroBg})` }} />

      <div className="hero__overlay" />

      <AnnouncementBar />

      <div className="hero__content">
        <h1 className="hero__title">עיצוב אדריכלי במחיר הגיוני</h1>
        <p className="hero__subtitle">
          תכנון חכם, התאמה אישית מלאה ואספקה תוך 14 ימי עסקים!
        </p>
        <Link to="#" className="hero__cta">
          כלי תכנון ← 
        </Link>
      </div>

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
                onClick={() => setCookieDismissed(true)}
              >
                אני מסכים
              </button>
              <button
                className="cookie-banner__dismiss"
                onClick={() => setCookieDismissed(true)}
              >
                דחייה
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
