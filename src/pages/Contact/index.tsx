import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Contact.css'
import { useSiteContent } from '../../hooks/useSiteContent'
import { api } from '../../lib/api'
import type { ContactContent } from '../../types/content'

type FormState = { name: string; email: string; message: string }
type FormErrors = Partial<Record<keyof FormState, string>>
type Status = 'idle' | 'sending' | 'success' | 'error'

const emptyForm: FormState = { name: '', email: '', message: '' }
const ACCESSIBILITY_MESSAGE_PREFIX = 'פניית נגישות:\n'

function validateContactForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const email = form.email.trim()

  if (form.name.trim().length < 2) {
    errors.name = 'יש להזין שם באורך של שני תווים לפחות.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'יש להזין כתובת אימייל תקינה.'
  }
  if (!form.message.trim() || form.message.trim() === ACCESSIBILITY_MESSAGE_PREFIX.trim()) {
    errors.message = 'יש להזין את תוכן הפנייה.'
  }

  return errors
}

export default function Contact() {
  const [searchParams] = useSearchParams()
  const isAccessibilityInquiry = searchParams.get('topic') === 'accessibility'
  const { data: content } = useSiteContent<ContactContent>('contact')
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    message: isAccessibilityInquiry ? ACCESSIBILITY_MESSAGE_PREFIX : '',
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const submitErrorRef = useRef<HTMLParagraphElement>(null)
  const contactEmail = content?.email?.trim()

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as keyof FormState
    const nextForm = { ...form, [field]: event.target.value }
    setForm(nextForm)
    if (submitAttempted) setErrors(validateContactForm(nextForm))
    if (status === 'error') setStatus('idle')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateContactForm(form)
    setSubmitAttempted(true)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    setStatus('sending')

    try {
      await api.post<void>('/contact', form)
      setStatus('success')
      setForm(emptyForm)
      setErrors({})
      setSubmitAttempted(false)
      window.requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setStatus('error')
      window.requestAnimationFrame(() => submitErrorRef.current?.focus())
    }
  }

  return (
    <section className="contact" dir="rtl">
      <div className="contact__layout">
        <div className="contact__details">
          <h1 className="contact__title">{content?.title || 'צרו קשר'}</h1>
          <p className="contact__intro">
            {isAccessibilityInquiry
              ? 'פנייה זו מיועדת לדיווח על קושי או לבקשת התאמת נגישות.'
              : 'לכל שאלה, מוזמנים לפנות אלינו.'}
          </p>

          <address className="contact__address">
            <p>
              טלפון משרד: <a href="tel:0555565617" dir="ltr">055-556-5617</a>
            </p>
            {contactEmail ? (
              <p>מייל: <a href={`mailto:${contactEmail}`} dir="ltr">{contactEmail}</a></p>
            ) : null}
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
          <h2 id="contact-form-title" className="contact__form-title">
            {isAccessibilityInquiry ? 'טופס פנייה בנושא נגישות' : 'טופס פנייה'}
          </h2>

          {isAccessibilityInquiry ? (
            <p id="accessibility-form-help" className="contact__form-help">
              מומלץ לציין כתובת עמוד, תיאור הקושי, דפדפן, מערכת הפעלה וטכנולוגיה
              מסייעת, אם נעשה בה שימוש.
            </p>
          ) : null}

          {status === 'success' ? (
            <div ref={successRef} className="contact__success" role="status" tabIndex={-1}>
              {content?.success_message || 'ההודעה נשלחה בהצלחה.'}
            </div>
          ) : (
            <form
              ref={formRef}
              className="contact__form"
              aria-labelledby="contact-form-title"
              aria-describedby={isAccessibilityInquiry ? 'accessibility-form-help' : undefined}
              aria-busy={status === 'sending'}
              noValidate
              onSubmit={handleSubmit}
            >
              {submitAttempted && Object.keys(errors).length > 0 ? (
                <p className="contact__validation-summary" role="alert">
                  יש לתקן את השדות המסומנים לפני שליחת הפנייה.
                </p>
              ) : null}

              <div className="contact__row">
                <label className="contact__field">
                  <span>שם מלא (חובה)</span>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    value={form.name}
                    onChange={handleChange}
                    aria-invalid={submitAttempted && Boolean(errors.name)}
                    aria-describedby={submitAttempted && errors.name ? 'contact-name-error' : undefined}
                    required
                  />
                  {submitAttempted && errors.name ? (
                    <span id="contact-name-error" className="contact__field-error">{errors.name}</span>
                  ) : null}
                </label>

                <label className="contact__field">
                  <span>מייל (חובה)</span>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={submitAttempted && Boolean(errors.email)}
                    aria-describedby={submitAttempted && errors.email ? 'contact-email-error' : undefined}
                    required
                  />
                  {submitAttempted && errors.email ? (
                    <span id="contact-email-error" className="contact__field-error">{errors.email}</span>
                  ) : null}
                </label>
              </div>

              <label className="contact__field">
                <span>תוכן הפנייה (חובה)</span>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  aria-invalid={submitAttempted && Boolean(errors.message)}
                  aria-describedby={submitAttempted && errors.message ? 'contact-message-error' : undefined}
                  required
                />
                {submitAttempted && errors.message ? (
                  <span id="contact-message-error" className="contact__field-error">{errors.message}</span>
                ) : null}
              </label>

              {status === 'error' ? (
                <p ref={submitErrorRef} className="contact__error" role="alert" tabIndex={-1}>
                  אירעה שגיאה בשליחה. אנא נסו שוב בעוד מעט.
                </p>
              ) : null}

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
