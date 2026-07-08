import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import './Cart.css'

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

type DeliveryMethod = 'pickup' | 'delivery'

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  pickup: 0,
  delivery: 400,
}

const INSTALLATION_FEE = 500

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

function formatPrice(value: number) {
  return value.toLocaleString('he-IL')
}

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(initialForm)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [wantsInstallation, setWantsInstallation] = useState(false)

  const itemsTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  )

  const deliveryFee = DELIVERY_FEES[deliveryMethod]
  const installationFee = wantsInstallation ? INSTALLATION_FEE : 0
  const total = itemsTotal + deliveryFee + installationFee

  const isFormValid =
    cartItems.length > 0 &&
    form.fullName.trim() !== '' &&
    form.city.trim() !== '' &&
    form.region.trim() !== '' &&
    form.streetAddress.trim() !== '' &&
    form.email.trim() !== '' &&
    form.phone.trim() !== '' &&
    form.agreedToTerms

  const handleTextChange =
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, agreedToTerms: event.target.checked }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isFormValid) return
    navigate('/checkout')
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
              const subtitle = [item.category, item.size].filter(Boolean).join(' · ')

              return (
                <li key={item.id} className="cart-page__item">
                  <button
                    type="button"
                    className="cart-page__remove"
                    aria-label={`הסר את ${item.name} מהעגלה`}
                    onClick={() => removeFromCart(item.id)}
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
                      <select
                        aria-label={`כמות עבור ${item.name}`}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                      >
                        {QUANTITY_OPTIONS.map((quantity) => (
                          <option key={quantity} value={quantity}>
                            {quantity}
                          </option>
                        ))}
                      </select>
                      <span className="cart-page__item-swatch" aria-hidden="true" />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {cartItems.length > 0 && (
          <p className="cart-page__subtotal">סך הכל {formatPrice(total)} ₪</p>
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
            משלוח עד הבית בתוספת {formatPrice(DELIVERY_FEES.delivery)} ₪
          </label>

          <label className="cart-page__delivery-option">
            <input
              type="checkbox"
              checked={wantsInstallation}
              onChange={(event) => setWantsInstallation(event.target.checked)}
            />
            התקנה בבית הלקוח (תשלום למתקין): {formatPrice(INSTALLATION_FEE)} ₪
          </label>
        </div>
      </section>

      <form className="cart-page__form" onSubmit={handleSubmit}>
        <div className="cart-page__field">
          <label htmlFor="fullName">שם לקוח *</label>
          <input
            id="fullName"
            required
            value={form.fullName}
            onChange={handleTextChange('fullName')}
          />
        </div>

        <div className="cart-page__field">
          <label htmlFor="idNumber">ת.ז (אופציונלי)</label>
          <input id="idNumber" value={form.idNumber} onChange={handleTextChange('idNumber')} />
        </div>

        <div className="cart-page__field">
          <label htmlFor="city">עיר *</label>
          <input id="city" required value={form.city} onChange={handleTextChange('city')} />
        </div>

        <div className="cart-page__field">
          <label htmlFor="region">מדינה / אזור *</label>
          <input id="region" required value={form.region} onChange={handleTextChange('region')} />
        </div>

        <div className="cart-page__field cart-page__field--wide">
          <label htmlFor="apartment">כתובת רחוב *</label>
          <div className="cart-page__field-row">
            <input
              id="apartment"
              placeholder="דירה, סוויטה, יחידה וכו' (אופציונלי)"
              value={form.apartment}
              onChange={handleTextChange('apartment')}
            />
            <input
              id="streetAddress"
              required
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

          <p className="cart-page__total">סך הכל לתשלום: {formatPrice(total)} ₪</p>

          <button type="submit" className="cart-page__submit" disabled={!isFormValid}>
            מעבר לתשלום
          </button>
        </div>
      </form>
    </main>
  )
}
