import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { api, ApiError } from '../../lib/api'
import { clearCartRecoveryNotice, hasCartRecoveryNotice, isCartReferenceValid } from '../../lib/cartStorage'
import { normalizeCheckoutText, normalizeIsraeliMobile } from '../../lib/checkoutInput'
import { formatServiceFee, quoteCartServiceFees } from '../../lib/serviceFees'
import './Cart.css'

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

type DeliveryMethod = 'pickup' | 'delivery'

type FormState = {
  fullName: string
  idNumber: string
  city: string
  region: string
  streetAddress: string
  apartment: string
  email: string
  phone: string
  agreedToTerms: boolean
}

type CheckoutErrors = Partial<Record<keyof FormState | 'cart', string>>

const initialForm: FormState = {
  fullName: '',
  idNumber: '',
  city: '',
  region: '',
  streetAddress: '',
  apartment: '',
  email: '',
  phone: '',
  agreedToTerms: false,
}

const ORDER_FIELD_LABELS: Record<string, string> = {
  full_name: 'שם מלא',
  phone: 'טלפון',
  email: 'אימייל',
  street: 'כתובת רחוב',
  city: 'עיר',
  region: 'מדינה או אזור',
  apartment: 'דירה',
  id_number: 'תעודת זהות',
}

function orderValidationMessage(error: ApiError): string {
  const labels = error.fields
    .map((field) => ORDER_FIELD_LABELS[field])
    .filter((label): label is string => Boolean(label))
  return labels.length
    ? `יש לבדוק את השדות הבאים: ${Array.from(new Set(labels)).join(', ')}.`
    : 'אחד מפרטי הלקוח אינו תקין. בדקו את השדות ונסו שוב.'
}

function formatPrice(value: number) {
  return value.toLocaleString('he-IL')
}

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState<FormState>(initialForm)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [wantsInstallation, setWantsInstallation] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const checkoutFormRef = useRef<HTMLFormElement>(null)
  const validationSummaryRef = useRef<HTMLDivElement>(null)
  const paymentErrorRef = useRef<HTMLParagraphElement>(null)
  const paymentState = searchParams.get('payment')
  const [recoveredStoredCart] = useState(hasCartRecoveryNotice)
  const [paymentError, setPaymentError] = useState(() => {
    if (recoveredStoredCart) {
      return 'הסרנו מהעגלה מוצר ישן שלא ניתן היה לאמת. הוסיפו אותו מחדש מהקטלוג.'
    }
    if (paymentState === 'failed') return 'התשלום לא אושר על ידי HYP. לא בוצע חיוב ואפשר לנסות שוב.'
    if (paymentState === 'cancelled') return 'התשלום בוטל. העגלה נשמרה ואפשר לנסות שוב.'
    return ''
  })

  useEffect(() => {
    if (recoveredStoredCart) clearCartRecoveryNotice()
  }, [recoveredStoredCart])

  const itemsTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  )

  const serviceQuote = useMemo(() => quoteCartServiceFees(cartItems), [cartItems])
  const deliveryFee = deliveryMethod === 'delivery' ? serviceQuote.deliveryFee : 0
  const installationFee = wantsInstallation ? serviceQuote.installationFee : 0
  // Delivery and installation are paid directly to their providers.
  const total = itemsTotal

  const checkoutErrors = useMemo(() => {
    const errors: CheckoutErrors = {}
    const fullName = normalizeCheckoutText(form.fullName)
    const fullNameParts = fullName.split(/\s+/).filter(Boolean)
    const normalizedPhone = normalizeIsraeliMobile(form.phone)
    const email = form.email.trim()
    const city = normalizeCheckoutText(form.city)
    const region = normalizeCheckoutText(form.region)
    const street = normalizeCheckoutText(form.streetAddress)
    const hasValidEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (cartItems.length === 0) errors.cart = 'יש להוסיף מוצר אחד לפחות לעגלה.'
    if (fullNameParts.length < 2 || fullName.length > 100) {
      errors.fullName = 'יש להזין שם פרטי ושם משפחה, עד 100 תווים.'
    }
    if (city.length < 2 || city.length > 100) {
      errors.city = 'יש להזין עיר באורך 2 עד 100 תווים.'
    }
    if (region.length < 2 || region.length > 100) {
      errors.region = 'יש להזין מדינה או אזור באורך 2 עד 100 תווים.'
    }
    if (street.length < 2 || street.length > 200) {
      errors.streetAddress = 'יש להזין רחוב ומספר בית, עד 200 תווים.'
    }
    if (form.apartment.trim().length > 50) {
      errors.apartment = 'אפשר להזין עד 50 תווים בשדה הדירה.'
    }
    if (form.idNumber.trim().length > 20) {
      errors.idNumber = 'אפשר להזין עד 20 תווים בשדה תעודת הזהות.'
    }
    if (!hasValidEmail) errors.email = 'יש להזין כתובת אימייל תקינה.'
    if (!/^05\d{8}$/.test(normalizedPhone)) {
      errors.phone = 'יש להזין מספר טלפון נייד ישראלי תקין בן 10 ספרות.'
    }
    if (!form.agreedToTerms) errors.agreedToTerms = 'יש לאשר את תנאי השימוש.'

    return errors
  }, [cartItems.length, form])

  const checkoutIssues = Object.values(checkoutErrors)
  const isFormValid = checkoutIssues.length === 0

  const handleTextChange =
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, agreedToTerms: event.target.checked }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    setSubmitAttempted(true)
    if (!isFormValid) {
      setPaymentError('')
      window.requestAnimationFrame(() => {
        const firstInvalidField = checkoutFormRef.current?.querySelector<HTMLElement>(
          '[aria-invalid="true"]',
        )
        const nextFocusTarget = firstInvalidField ?? validationSummaryRef.current
        nextFocusTarget?.focus()
      })
      return
    }

    setIsSubmitting(true)
    setPaymentError('')
    try {
      // Rebuild the server cart from product identifiers. The backend resolves
      // and locks prices, so browser-side prices can never control the charge.
      await api.delete<void>('/cart')
      for (const item of cartItems) {
        if (!isCartReferenceValid(item)) {
          throw new ApiError(422, 'המוצר בעגלה נשמר מגרסה ישנה.', '/cart/items')
        }
        await api.post<unknown>('/cart/items', {
          ...(item.configurationId
            ? { configuration_id: item.configurationId }
            : { product_id: item.id, variant_id: item.variantId }),
          quantity: item.quantity,
        })
      }

      const order = await api.post<{ id: string }>('/orders', {
        shipping_address: {
          full_name: normalizeCheckoutText(form.fullName),
          phone: normalizeIsraeliMobile(form.phone),
          email: form.email.trim(),
          street: normalizeCheckoutText(form.streetAddress),
          city: normalizeCheckoutText(form.city),
          region: normalizeCheckoutText(form.region),
          apartment: normalizeCheckoutText(form.apartment) || null,
          id_number: form.idNumber.trim() || null,
        },
        delivery_method: deliveryMethod,
        wants_installation: wantsInstallation,
      })
      const payment = await api.post<{ checkout_url: string }>(`/payments/checkout/${order.id}`, {})
      window.location.assign(payment.checkout_url)
    } catch (error) {
      const detail = error instanceof ApiError && error.status === 422
        ? error.path === '/cart/items'
          ? 'המוצר בעגלה אינו תקין או נשמר מגרסה ישנה. הסירו אותו והוסיפו מחדש מהקטלוג.'
          : error.path === '/orders'
            ? orderValidationMessage(error)
            : error.message
        : error instanceof ApiError
          ? error.message
          : ''
      setPaymentError(detail || 'לא הצלחנו לפתוח את התשלום. נסו שוב בעוד רגע.')
      setIsSubmitting(false)
      window.requestAnimationFrame(() => paymentErrorRef.current?.focus())
    }
  }

  return (
    <div className="cart-page">
      <header className="cart-page__header">
        <h1>עגלת קניות</h1>
        <button
          type="button"
          className="cart-page__back"
          aria-label="חזרה"
          onClick={() => navigate(-1)}
        >
          {"›"}
        </button>
      </header>

      <section className="cart-page__summary">
        {cartItems.length === 0 ? (
          <p className="cart-page__empty">העגלה שלך ריקה</p>
        ) : (
          <ul className="cart-page__items">
            {cartItems.map((item) => {
              const subtitle = [item.category, item.size, item.variant].filter(Boolean).join(' · ')
              const lineId = item.lineId ?? item.id
              return (
                <li key={lineId} className="cart-page__item">
                  <button
                    type="button"
                    className="cart-page__remove"
                    aria-label={`הסר את ${item.name} מהעגלה`}
                    onClick={() => removeFromCart(lineId)}
                  >
                    ×
                  </button>

                  <div className="cart-page__item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-page__item-placeholder">{item.name}</div>
                    )}
                  </div>

                  <div className="cart-page__item-info">
                    <h3>{item.name}</h3>
                    {subtitle && <p className="cart-page__item-subtitle">{subtitle}</p>}
                    <div className="cart-page__item-footer">
                      <span className="cart-page__item-price">{formatPrice(item.price)} ₪</span>
                      {item.fixedQuantity ? (
                        <span className="cart-page__fixed-quantity">כמות 1</span>
                      ) : (
                        <select
                          aria-label={`כמות עבור ${item.name}`}
                          value={item.quantity}
                          onChange={(event) => updateQuantity(lineId, Number(event.target.value))}
                        >
                          {QUANTITY_OPTIONS.map((quantity) => (
                            <option key={quantity} value={quantity}>
                              {quantity}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {cartItems.length > 0 && (
          <p className="cart-page__subtotal">סך הכל מוצרים {formatPrice(total)} ₪</p>
        )}

        <fieldset className="cart-page__delivery">
          <legend>אפשרויות אספקה ושירות</legend>
          <label className="cart-page__delivery-option">
            <input
              type="radio"
              name="delivery-method"
              checked={deliveryMethod === 'pickup'}
              onChange={() => setDeliveryMethod('pickup')}
            />
            איסוף עצמי ממחסני החברה - חינם
          </label>

          <label className="cart-page__delivery-option">
            <input
              type="radio"
              name="delivery-method"
              checked={deliveryMethod === 'delivery'}
              onChange={() => setDeliveryMethod('delivery')}
            />
            משלוח עד הבית: {formatServiceFee(serviceQuote.deliveryFee, serviceQuote.requiresManualQuote)}
            {' — תשלום נפרד לשליח'}
          </label>

          <label className="cart-page__delivery-option">
            <input
              type="checkbox"
              checked={wantsInstallation}
              onChange={(event) => setWantsInstallation(event.target.checked)}
            />
            התקנה בבית הלקוח: {formatServiceFee(serviceQuote.installationFee, serviceQuote.requiresManualQuote)}
            {' — תשלום נפרד למתקין'}
          </label>
          {(deliveryMethod === 'delivery' || wantsInstallation) && (
            <div className="cart-page__service-summary" role="status">
              <strong>תשלומים נפרדים שאינם נכללים בתשלום באתר</strong>
              {deliveryMethod === 'delivery' && <span>לשליח: {formatServiceFee(deliveryFee, serviceQuote.requiresManualQuote)}</span>}
              {wantsInstallation && <span>למתקין: {formatServiceFee(installationFee, serviceQuote.requiresManualQuote)}</span>}
            </div>
          )}
        </fieldset>
      </section>

      <form
        ref={checkoutFormRef}
        className="cart-page__form"
        aria-labelledby="checkout-form-title"
        aria-busy={isSubmitting}
        noValidate
        onSubmit={handleSubmit}
      >
        <h2 id="checkout-form-title" className="cart-page__form-title">
          פרטי לקוח ותשלום
        </h2>

        <div className="cart-page__field">
          <label htmlFor="fullName">שם מלא (חובה)</label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={form.fullName}
            onChange={handleTextChange('fullName')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.fullName)}
            aria-describedby={submitAttempted && checkoutErrors.fullName ? 'fullName-error' : undefined}
          />
          {submitAttempted && checkoutErrors.fullName ? (
            <span id="fullName-error" className="cart-page__field-error">{checkoutErrors.fullName}</span>
          ) : null}
        </div>

        <div className="cart-page__field">
          <label htmlFor="idNumber">ת.ז (אופציונלי)</label>
          <input
            id="idNumber"
            name="idNumber"
            inputMode="numeric"
            maxLength={20}
            value={form.idNumber}
            onChange={handleTextChange('idNumber')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.idNumber)}
            aria-describedby={submitAttempted && checkoutErrors.idNumber ? 'idNumber-error' : undefined}
          />
          {submitAttempted && checkoutErrors.idNumber ? (
            <span id="idNumber-error" className="cart-page__field-error">{checkoutErrors.idNumber}</span>
          ) : null}
        </div>

        <div className="cart-page__field">
          <label htmlFor="city">עיר (חובה)</label>
          <input
            id="city"
            name="city"
            autoComplete="address-level2"
            required
            minLength={2}
            maxLength={100}
            value={form.city}
            onChange={handleTextChange('city')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.city)}
            aria-describedby={submitAttempted && checkoutErrors.city ? 'city-error' : undefined}
          />
          {submitAttempted && checkoutErrors.city ? (
            <span id="city-error" className="cart-page__field-error">{checkoutErrors.city}</span>
          ) : null}
        </div>

        <div className="cart-page__field">
          <label htmlFor="region">מדינה / אזור (חובה)</label>
          <input
            id="region"
            name="region"
            autoComplete="address-level1"
            required
            minLength={2}
            maxLength={100}
            value={form.region}
            onChange={handleTextChange('region')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.region)}
            aria-describedby={submitAttempted && checkoutErrors.region ? 'region-error' : undefined}
          />
          {submitAttempted && checkoutErrors.region ? (
            <span id="region-error" className="cart-page__field-error">{checkoutErrors.region}</span>
          ) : null}
        </div>

        <fieldset className="cart-page__field cart-page__field--wide cart-page__address-group">
          <legend>כתובת למשלוח</legend>
          <div className="cart-page__field-row">
            <div className="cart-page__subfield">
              <label htmlFor="streetAddress">רחוב ומספר בית (חובה)</label>
              <input
                id="streetAddress"
                name="streetAddress"
                autoComplete="address-line1"
                required
                minLength={2}
                maxLength={200}
                value={form.streetAddress}
                onChange={handleTextChange('streetAddress')}
                aria-invalid={submitAttempted && Boolean(checkoutErrors.streetAddress)}
                aria-describedby={submitAttempted && checkoutErrors.streetAddress ? 'streetAddress-error' : undefined}
              />
              {submitAttempted && checkoutErrors.streetAddress ? (
                <span id="streetAddress-error" className="cart-page__field-error">{checkoutErrors.streetAddress}</span>
              ) : null}
            </div>

            <div className="cart-page__subfield">
              <label htmlFor="apartment">דירה / יחידה (אופציונלי)</label>
              <input
                id="apartment"
                name="apartment"
                autoComplete="address-line2"
                maxLength={50}
                value={form.apartment}
                onChange={handleTextChange('apartment')}
                aria-invalid={submitAttempted && Boolean(checkoutErrors.apartment)}
                aria-describedby={submitAttempted && checkoutErrors.apartment ? 'apartment-error' : undefined}
              />
              {submitAttempted && checkoutErrors.apartment ? (
                <span id="apartment-error" className="cart-page__field-error">{checkoutErrors.apartment}</span>
              ) : null}
            </div>
          </div>
        </fieldset>

        <div className="cart-page__field">
          <label htmlFor="email">כתובת אימייל (חובה)</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            onChange={handleTextChange('email')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.email)}
            aria-describedby={submitAttempted && checkoutErrors.email ? 'email-error' : undefined}
          />
          {submitAttempted && checkoutErrors.email ? (
            <span id="email-error" className="cart-page__field-error">{checkoutErrors.email}</span>
          ) : null}
        </div>

        <div className="cart-page__field">
          <label htmlFor="phone">טלפון נייד (חובה)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            inputMode="tel"
            maxLength={25}
            value={form.phone}
            onChange={handleTextChange('phone')}
            aria-invalid={submitAttempted && Boolean(checkoutErrors.phone)}
            aria-describedby={submitAttempted && checkoutErrors.phone ? 'phone-error' : undefined}
          />
          {submitAttempted && checkoutErrors.phone ? (
            <span id="phone-error" className="cart-page__field-error">{checkoutErrors.phone}</span>
          ) : null}
        </div>

        <div className="cart-page__payment">
          <label className="cart-page__terms" htmlFor="agreedToTerms">
            <input
              id="agreedToTerms"
              name="agreedToTerms"
              type="checkbox"
              checked={form.agreedToTerms}
              onChange={handleTermsChange}
              aria-invalid={submitAttempted && Boolean(checkoutErrors.agreedToTerms)}
              aria-describedby={submitAttempted && checkoutErrors.agreedToTerms ? 'agreedToTerms-error' : undefined}
            />
            <span>
              קראתי והסכמתי ל<a href="/terms">תנאי השימוש</a> (חובה)
            </span>
          </label>
          {submitAttempted && checkoutErrors.agreedToTerms ? (
            <span id="agreedToTerms-error" className="cart-page__field-error">{checkoutErrors.agreedToTerms}</span>
          ) : null}

          <p className="cart-page__total">סך הכל לתשלום באתר: {formatPrice(total)} ₪</p>

          {paymentError ? (
            <p ref={paymentErrorRef} className="cart-page__payment-error" role="alert" tabIndex={-1}>
              {paymentError}
            </p>
          ) : null}

          {submitAttempted && !isFormValid ? (
            <div
              ref={validationSummaryRef}
              className="cart-page__validation-hint"
              id="checkout-requirements"
              role="alert"
              tabIndex={-1}
            >
              <strong>יש לתקן את הפרטים הבאים:</strong>
              <ul>
                {checkoutIssues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            </div>
          ) : null}

          <button
            type="submit"
            className="cart-page__submit"
            disabled={isSubmitting}
            aria-describedby={submitAttempted && !isFormValid ? 'checkout-requirements' : undefined}
          >
            {isSubmitting ? 'פותחים תשלום מאובטח…' : 'מעבר לתשלום מאובטח'}
          </button>
        </div>
      </form>
    </div>
  )
}
