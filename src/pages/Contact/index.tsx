import { useState } from 'react'
import './Contact.css'
import { useSiteContent } from '../../hooks/useSiteContent'
import type { ContactContent } from '../../types/content'

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL as string

type FormState = { name: string; email: string; message: string }
type Status = 'idle' | 'sending' | 'success' | 'error'

const emptyForm: FormState = { name: '', email: '', message: '' }

export default function Contact() {
  const { data: content } = useSiteContent<ContactContent>('contact')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<Status>('idle')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('sending')

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error('webhook error')
      setStatus('success')
      setForm(emptyForm)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="contact" dir="rtl">
      <div className="contact__layout">
        <div className="contact__details">
          <h1 className="contact__title">{content?.title || 'צרו קשר'}</h1>
          <p className="contact__intro">לכל שאלה, מוזמנים לפנות אלינו.</p>

          <address className="contact__address">
            <p>
              טלפון משרד: <a href="tel:0555565617" dir="ltr">055-556-5617</a>
            </p>
            <p>מייל:</p>
            <p>כתובת לאיסוף עצמי: מומנטום - שדרות טום לנטוס 10, נתניה</p>
          </address>

          <div className="contact__map">
            <iframe
              title="מפת הגעה למומנטום, שדרות טום לנטוס 10, נתניה"
              src="https://www.google.com/maps?q=%D7%9E%D7%95%D7%9E%D7%A0%D7%98%D7%95%D7%9D%2C%20%D7%A9%D7%93%D7%A8%D7%95%D7%AA%20%D7%98%D7%95%D7%9D%20%D7%9C%D7%A0%D7%98%D7%95%D7%A1%2010%2C%20%D7%A0%D7%AA%D7%A0%D7%99%D7%94&amp;z=15&amp;output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div className="contact__form-card">
          <h2 className="contact__form-title">טופס פנייה</h2>

          {status === 'success' ? (
            <div className="contact__success" role="status">
              {content?.success_message || 'ההודעה נשלחה בהצלחה.'}
            </div>
          ) : (
            <form className="contact__form" onSubmit={handleSubmit}>
              <div className="contact__row">
                <label className="contact__field">
                  <span>שם מלא</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="contact__field">
                  <span>מייל</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label className="contact__field">
                <span>תוכן הפנייה</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </label>

              {status === 'error' && (
                <p className="contact__error" role="alert">
                  אירעה שגיאה בשליחה. אנא נסו שוב בעוד מעט.
                </p>
              )}

              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'שולח...' : 'שליחת פנייה'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
