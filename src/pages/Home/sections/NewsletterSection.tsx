import React, { useState } from 'react'
import { EmnailInput } from '../../../components/Input/EmailInput'


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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)

  return (
    <section className="newsletter">
      <p className="newsletter__subtitle">בואו להשאר מעודכנים.</p>
      <h2 className="newsletter__title">ניוזלטר סאבור</h2>

      <form className="newsletter__form" onSubmit={handleSubmit}>
        <EmnailInput handleChange={handleChange} email={email} /> 
        <label className="newsletter__consent">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            אני מסכים/ה לקבל דיוור ישיר, הודעות, דברי פרסום <br />ומסרים שיווקים 
            מהאתר באמצעות הדוא״ל
          </span>
        </label>
      </form>
    </section>
  )
}
