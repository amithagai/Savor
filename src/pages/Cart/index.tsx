import { useEffect, useMemo, useState } from 'react'
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
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const checkoutIssues = useMemo(() => {
    const issues: string[] = []
    const fullName = normalizeCheckoutText(form.fullName)
    const fullNameParts = fullName.split(/\s+/).filter(Boolean)
    const normalizedPhone = normalizeIsraeliMobile(form.phone)
    const email = form.email.trim()
    const city = normalizeCheckoutText(form.city)
    const region = normalizeCheckoutText(form.region)
    const street = normalizeCheckoutText(form.streetAddress)
    const hasValidEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (cartItems.length === 0) issues.push('מוצר אחד לפחות בעגלה')
    if (fullNameParts.length < 2 || fullName.length > 100) issues.push('שם מלא – שם פרטי ומשפחה')
    if (city.length < 2 || city.length > 100) issues.push('עיר תקינה')
    if (region.length < 2 || region.length > 100) issues.push('מדינה או אזור תקינים')
    if (street.length < 2 || street.length > 200) issues.push('כתובת רחוב ומספר בית תקינים')
    if (form.apartment.trim().length > 50) issues.push('דירה – עד 50 תווים')
    if (form.idNumber.trim().length > 20) issues.push('תעודת זהות – עד 20 תווים')
    if (!hasValidEmail) issues.push('כתובת אימייל תקינה')
    if (!/^05\d{8}$/.test(normalizedPhone)) issues.push('טלפון נייד תקין בן 10 ספרות')
    if (!form.agreedToTerms) issues.push('אישור תנאי השימוש')

    return issues
  }, [cartItems.length, form])

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
    if (!isFormValid || isSubmitting) return

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
    }
  }

  return (
    <main className="cart-page">
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

        <div className="cart-page__delivery">
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
        </div>
      </section>

      <form className="cart-page__form" onSubmit={handleSubmit}>
        <div className="cart-page__field">
          <label htmlFor="fullName">שם לקוח *</label>
          <input
            id="fullName"
            required
            minLength={2}
            maxLength={100}
            value={form.fullName}
            onChange={handleTextChange('fullName')}
          />
        </div>

        <div className="cart-page__field">
          <label htmlFor="idNumber">ת.ז (אופציונלי)</label>
          <input id="idNumber" maxLength={20} value={form.idNumber} onChange={handleTextChange('idNumber')} />
        </div>

        <div className="cart-page__field">
          <label htmlFor="city">עיר *</label>
          <input id="city" required minLength={2} maxLength={100} value={form.city} onChange={handleTextChange('city')} />
        </div>

        <div className="cart-page__field">
          <label htmlFor="region">מדינה / אזור *</label>
          <input id="region" required minLength={2} maxLength={100} value={form.region} onChange={handleTextChange('region')} />
        </div>

        <div className="cart-page__field cart-page__field--wide">
          <label htmlFor="apartment">כתובת רחוב *</label>
          <div className="cart-page__field-row">
            <input
              id="apartment"
              maxLength={50}
              placeholder="דירה, סוויטה, יחידה וכו' (אופציונלי)"
              value={form.apartment}
              onChange={handleTextChange('apartment')}
            />
            <input
              id="streetAddress"
              required
              minLength={2}
              maxLength={200}
              placeholder="מספר בית ושם רחוב"
              value={form.streetAddress}
              onChange={handleTextChange('streetAddress')}
            />
          </div>
        </div>

        <div className="cart-page__field">
          <label htmlFor="email">כתובת אימייל *</label>
          <input
            id="email"
            type="email"
            required
            maxLength={254}
            placeholder="כתובת אימייל"
            value={form.email}
            onChange={handleTextChange('email')}
          />
        </div>

        <div className="cart-page__field">
          <label htmlFor="phone">טלפון *</label>
          <input
            id="phone"
            type="tel"
            required
            inputMode="tel"
            maxLength={25}
            placeholder="טלפון"
            value={form.phone}
            onChange={handleTextChange('phone')}
          />
        </div>

        <div className="cart-page__payment">
          <label className="cart-page__terms">
            <input type="checkbox" checked={form.agreedToTerms} onChange={handleTermsChange} />
            <span>
              קראתי והסכמתי ל<a href="/terms">תנאי השימוש</a> *
            </span>
          </label>

          <p className="cart-page__total">סך הכל לתשלום באתר: {formatPrice(total)} ₪</p>

          {paymentError && <p className="cart-page__payment-error" role="alert">{paymentError}</p>}

          {!isFormValid && !!cartItems.length && (
            <div className="cart-page__validation-hint" id="checkout-requirements" role="status" aria-live="polite">
              <strong>כדי להמשיך לתשלום יש להשלים:</strong>
              <ul>
                {checkoutIssues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="cart-page__submit"
            disabled={!isFormValid || isSubmitting}
            aria-describedby={!isFormValid ? 'checkout-requirements' : undefined}
          >
            {isSubmitting ? 'פותחים תשלום מאובטח…' : 'מעבר לתשלום מאובטח'}
          </button>
        </div>
      </form>
    </main>
  )
}
