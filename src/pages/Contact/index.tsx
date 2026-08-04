import { useState } from 'react'
import './Contact.css'
import { useSiteContent } from '../../hooks/useSiteContent'
import type { ContactContent } from '../../types/content'

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL as string

type FormState = { name: string; email: string; phone: string; message: string }
type Status = 'idle' | 'sending' | 'success' | 'error'

export default function Contact() {
  const { data: content, loading: contentLoading } = useSiteContent<ContactContent>('contact')
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('webhook error')
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="contact">
      <div className="contact__container">
        <h1 className="contact__title">{content?.title || (contentLoading ? 'טוען…' : 'צרו קשר')}</h1>
        {content && <p className="contact__subtitle">{content.subtitle}</p>}

        {status === 'success' ? (
          <div className="contact__success">
            {content?.success_message || 'ההודעה נשלחה בהצלחה.'}
          </div>
        ) : (
          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__row">
              <input
                name="name"
                type="text"
                placeholder="שם מלא"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="כתובת אימייל"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <input
              name="phone"
              type="tel"
              placeholder="מספר טלפון (אופציונלי)"
              value={form.phone}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="כתבו את הודעתכם כאן..."
              value={form.message}
              onChange={handleChange}
              rows={5}
              required
            />
            {status === 'error' && (
              <p className="contact__error">אירעה שגיאה בשליחה. אנא נסו שוב בעוד מעט.</p>
            )}
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'שולח...' : 'שלח הודעה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
