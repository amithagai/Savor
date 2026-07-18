import { useState } from 'react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !email) return
    // TODO: wire to backend
    setEmail('')
    setAgreed(false)
  }

  return (
    <section className="newsletter">
      <p className="newsletter__subtitle">באו להשאר מעודכנים.</p>
      <h2 className="newsletter__title">ניוזלטר סאבור</h2>

      <form className="newsletter__form" onSubmit={handleSubmit}>
        <div className="newsletter__input-row">
          <input
            type="email"
            placeholder="כתובת אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">הרשמה</button>
        </div>
        <label className="newsletter__consent">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            אני מסכים/ה לקבל דיוור ישיר, הודעות, דברי פרסום ומסרים שיווקים
            מהאחר באמצעות הדוא״ל
          </span>
        </label>
      </form>
    </section>
  )
}
