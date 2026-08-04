import React, { useState } from 'react'
import { EmnailInput } from '../../../components/Input/EmailInput'
import type { HomeContent } from '../../../types/content'


export default function NewsletterSection({ content }: { content: HomeContent['newsletter'] }) {
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
      <p className="newsletter__subtitle">{content.subtitle}</p>
      <h2 className="newsletter__title">{content.title}</h2>

      <form className="newsletter__form" onSubmit={handleSubmit}>
        <EmnailInput handleChange={handleChange} email={email} /> 
        <label className="newsletter__consent">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            {content.consent}
          </span>
        </label>
      </form>
    </section>
  )
}
