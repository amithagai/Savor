import { useState, type FC } from 'react'
import './Configurator.css'

type ColorOption = { id: string; label: string; hex: string }
type CabinetCategory = 'תחתונים' | 'כיור' | 'גבוהים' | 'עליונים'

type CabinetProduct = {
  id: string
  name: string
  subtitle: string
  width: number
  price: number
  category: CabinetCategory
}

type CartItem = CabinetProduct & { qty: number }

const COLORS: ColorOption[] = [
  { id: 'cream', label: 'CREAM', hex: '#C8AE8A' },
  { id: 'timber', label: 'TIMBER', hex: '#9B7B3E' },
  { id: 'cloud', label: 'CLOUD', hex: '#B4B0AB' },
  { id: 'latte', label: 'LATTE', hex: '#DDD9D4' },
]

const CATEGORIES: CabinetCategory[] = ['עליונים', 'גבוהים', 'תחתונים', 'כיור']

const PRODUCTS: CabinetProduct[] = [
  { id: 'p1', name: 'CREAM דגם - יחידת תנור', subtitle: 'יחידות תנור', width: 60, price: 1230, category: 'תחתונים' },
  { id: 'p13', name: 'CREAM דגם - יחידת תנור', subtitle: 'יחידות תנור', width: 60, price: 1230, category: 'תחתונים' },
  { id: 'p12', name: 'CREAM דגם - יחידת תנור', subtitle: 'יחידות תנור', width: 60, price: 1230, category: 'תחתונים' },
  { id: 'p11', name: 'CREAM דגם - יחידת תנור', subtitle: 'יחידות תנור', width: 60, price: 1230, category: 'תחתונים' },
  { id: 'p2', name: 'ארון תחתון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 1230, category: 'תחתונים' },
  { id: 'p3', name: 'ארון תחתון 90 ס"מ - חזית 3 דלתות', subtitle: 'חזית 3 דלתות', width: 90, price: 1490, category: 'תחתונים' },
  { id: 'p4', name: 'ארון תחתון 45 ס"מ - חזית דלת', subtitle: 'חזית דלת', width: 45, price: 980, category: 'תחתונים' },
  { id: 'p5', name: 'ארון עליון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 980, category: 'עליונים' },
  { id: 'p6', name: 'ארון עליון 90 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 90, price: 1150, category: 'עליונים' },
  { id: 'p7', name: 'ארון עליון 30 ס"מ - חזית דלת', subtitle: 'חזית דלת', width: 30, price: 720, category: 'עליונים' },
  { id: 'p8', name: 'ארון גבוה 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 1650, category: 'גבוהים' },
  { id: 'p9', name: 'ארון גבוה 60 ס"מ - חזית 4 דלתות', subtitle: 'חזית 4 דלתות', width: 60, price: 1850, category: 'גבוהים' },
  { id: 'p10', name: 'ארון כיור 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 1350, category: 'כיור' },
  { id: 'p11', name: 'ארון כיור 80 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 80, price: 1550, category: 'כיור' },
]

const HOW_STEPS = [
  'בוחרים את המידה: מתחילים מהגדרת אורך הקיר של המטבח שלכם.',
  'בוחרים רהיטים ובנייתם: בוחרים את יחידות המתאימות (ארונות תחתונים, עליונים או ארונות גבוהים) ולפשוט אותם גורמים לתוך ההדמיה.',
  'משלימים את העיצוב: בודקים שהכל ישבב במקום, רואים את התוצאה הסופית, ויכולים להתקדם להזמנה!',
]

const INITIAL_CART: CartItem[] = [
  { ...PRODUCTS[0], qty: 1 },
  { ...PRODUCTS[1], qty: 1 },
  { ...PRODUCTS[2], qty: 1 },
]
interface ActionButtonProps {
  resetAll: () => void
}

const TotalPrice: FC<{ cartItems: Array<CartItem> }> = ({ cartItems }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <>
      {cartItems.length > 0 && (
        <p className="cfg__total">סך הכל {total.toLocaleString()} ₪</p>
      )}
    </>
  )
}

export const ActionButton: FC<ActionButtonProps> = ({ resetAll }) => {

  return (
    <div className="cfg__cart-footer">
      <button onClick={resetAll}>איפוס</button>
      <button className="cfg__outline-btn">שמירת תכנון ויצרות קשר</button>
      <button className="cfg__buy-btn">לרכישת המטבח</button>
    </div>
  )
}

export default function Configurator() {
  const [wallLength, setWallLength] = useState('')
  const [selectedColor, setSelectedColor] = useState('cream')
  const [activeCategory, setActiveCategory] = useState<CabinetCategory>('תחתונים')
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART)
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D')
  const [hoverColor, setHoverColor] = useState<string | null>(null)

  const filteredProducts = PRODUCTS.filter(p => p.category === activeCategory)
  const colorHex = COLORS.find(c => c.id === selectedColor)?.hex ?? '#C8AE8A'

  function addToCart(product: CabinetProduct) {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id))
    } else {
      setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item))
    }
  }

  function removeItem(id: string) {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  function resetAll() {
    setCartItems([])
    setWallLength('')
  }

  return (
    <div className="cfg" dir="rtl">

      {/* ══════════ TOP INFO SECTION ══════════ */}
      <div className="cfg__top">

        {/* RIGHT side (RTL start — first in DOM): title + controls */}
        <div className="cfg__header">
          <div className="cfg__title-block">
            <h1 className="cfg__title">
              כלי תכנון  <span> - מטבח בעיצוב אישי </span>
            </h1>
            <p className="cfg__desc">
              תמיד חלמתם על מטבח בצמכם? כעת זה פשוט יותר מאי פעם. המערכת החכמה שלנו
              מאפשרת לכם לשחק עם המידות, לגרור את הארונות שאתם צריכים, ולראות איך
              המטבח שלכם קורם עור וגידים – הכל אונליין, בקלות ובמהירות.
            </p>
          </div>

          <div className="cfg__wall-row">
            <span className="cfg__field-label">כתבו את אורך קיר המטבח (ס"מ)</span>
            <div className="cfg__wall-input-group">
              <input
                className="cfg__wall-input"
                type="text"
                placeholder="לדוגמה: 150"
                value={wallLength}
                onChange={e => setWallLength(e.target.value)}
              />
              <button className="cfg__wall-update">עדכן</button>
            </div>
          </div>
        </div>

        {/* LEFT side (RTL end — second in DOM): how-to steps */}
        <div className="cfg__steps">
          <p className="cfg__steps-label">איך זה עובד?</p>
          <ol className="cfg__steps-list">
            {HOW_STEPS.map((step, i) => (
              <li key={i}>
                <span className="cfg__step-num">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>

      </div>

      <div className='cfg__filter-row'>
        <div className="cfg__catalog-hdr">
          <h2 className="cfg__catalog-title">ארונות</h2>
          <div className="cfg__tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cfg__tab${activeCategory === cat ? ' cfg__tab--on' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="cfg__color-row">
          <h2 className="cfg__field-label">צבעים</h2>
          <div className="cfg__color-dots">
            {COLORS.map(c => (
              <div
                key={c.id}
                className="cfg__color-wrap"
                onMouseEnter={() => setHoverColor(c.id)}
                onMouseLeave={() => setHoverColor(null)}
              >
                <button
                  className={`cfg__color-dot${selectedColor === c.id ? ' cfg__color-dot--on' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setSelectedColor(c.id)}
                  aria-label={c.label}
                />
                {hoverColor === c.id && (
                  <span className="cfg__color-tip">{c.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>



        <ActionButton resetAll={resetAll} />
      </div>

      {/* ══════════ MAIN THREE-PANEL ══════════ */}
      <div className="cfg__main">

        {/* RIGHT panel: product catalog (RTL start — first in DOM) */}
        <div className="cfg__catalog">
          <div className="cfg__product-list">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="cfg__product"
                onClick={() => addToCart(product)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && addToCart(product)}
              >
                <div className="cfg__product-img" />
                <div className="cfg__product-info">
                  <span className="cfg__product-name">{product.name}</span>
                  <span className="cfg__product-price">
                    {product.width} ס"מ מ- {product.price.toLocaleString()} ₪
                  </span>
                </div>
                <div className="cfg__product-swatch" style={{ background: colorHex }} />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER panel: visualization canvas */}
        <div className="cfg__canvas">
          <div className="cfg__canvas-area" />
          <div className="cfg__view-btns">
            {(['3D', '2D'] as const).map(mode => (
              <button
                key={mode}
                className={`cfg__view-btn${viewMode === mode ? ' cfg__view-btn--on' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* LEFT panel: shopping list (RTL end — last in DOM) */}
        <div className="cfg__cart">
          <h2 className="cfg__cart-title">המטבח שלכם</h2>

          <div className="cfg__cart-items">
            {cartItems.length === 0 && (
              <p className="cfg__cart-empty">לחצו על מוצר כדי להוסיף</p>
            )}
            {cartItems.map(item => (
              <div key={item.id} className="cfg__cart-item">
                <div className="cfg__ci-info">
                  <span className="cfg__ci-name">{item.name}</span>
                  <span className="cfg__ci-sub">{item.subtitle}</span>
                </div>
                <div className="cfg__ci-row">
                  <span className="cfg__ci-price">₪ {item.price.toLocaleString()}</span>
                  <div className="cfg__ci-qty">
                    <select
                      className="cfg__qty-select"
                      value={item.qty}
                      onChange={e => setQty(item.id, Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="cfg__ci-remove"
                    style={{ background: colorHex }}
                    onClick={() => removeItem(item.id)}
                    aria-label="הסר פריט"
                  />
                </div>
              </div>
            ))}
          </div>

          <TotalPrice cartItems={cartItems} />
        </div>

      </div>
    </div>
  )
}
