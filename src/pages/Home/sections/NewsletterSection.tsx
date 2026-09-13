import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { EmailInput } from '../../../components/Input/EmailInput'
import type { HomeContent } from '../../../types/content'


export default function NewsletterSection({ content }: { content: HomeContent['newsletter'] }) {
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!agreed || !email) return
    // TODO: wire to backend
    setEmail('')
    setAgreed(false)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)

  return (
    <section className="newsletter">
      <p className="newsletter__subtitle">{content.subtitle}</p>
      <h2 id="home-newsletter-title" className="newsletter__title">{content.title}</h2>

      <form className="newsletter__form" aria-labelledby="home-newsletter-title" onSubmit={handleSubmit}>
        <EmailInput
          id="home-newsletter-email"
          label="כתובת אימייל להרשמה לניוזלטר"
          handleChange={handleChange}
          email={email}
        />
        <label className="newsletter__consent" htmlFor="home-newsletter-consent">
          <input
            id="home-newsletter-consent"
            name="newsletterConsent"
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            required
          />
          <span>
            {content.consent}
          </span>
        </label>
      </form>
    </section>
  )
}
