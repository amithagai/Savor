import { useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import './Configurator.css'
import { sketch } from '../../assets/cloudinaryImages'
import HeartIcon from '../../components/HeartIcon'
import { useWishlist } from '../../context/useWishlist'
import KitchenModelViewer from './KitchenModelViewer'

type ColorOption = { id: string; label: string; hex: string }
type CabinetCategory = 'תחתונים' | 'כיור' | 'גבוהים' | 'עליונים'

type CabinetProduct = {
  id: string
  name: string
  subtitle: string
  width: number
  price: number
  category: CabinetCategory
  modelSlug?: string
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
  { id: 'p1', name: 'ארון תנור 60 ס"מ', subtitle: 'יחידת תנור', width: 60, price: 670, category: 'תחתונים', modelSlug: 'oven-60' },
  { id: 'p2', name: 'ארון תחתון 30 ס"מ - מדף ומגירה', subtitle: 'מדף ומגירה', width: 30, price: 660, category: 'תחתונים', modelSlug: 'shelf-drawer-30' },
  { id: 'p3', name: 'ארון תחתון 60 ס"מ - מדף ומגירה', subtitle: 'מדף ומגירה', width: 60, price: 770, category: 'תחתונים', modelSlug: 'shelf-drawer-60' },
  { id: 'p4', name: 'ארון תחתון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 600, category: 'תחתונים', modelSlug: 'base-60-2door' },
  { id: 'p5', name: 'ארון תחתון 60 ס"מ - חזית דלת', subtitle: 'חזית דלת', width: 60, price: 640, category: 'תחתונים', modelSlug: 'base-60-1door' },
  { id: 'p6', name: 'ארון תחתון 80 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 80, price: 740, category: 'תחתונים', modelSlug: 'base-80-2door' },
  { id: 'p7', name: 'ארון תחתון 60 ס"מ - שלוש מגירות', subtitle: 'שלוש מגירות', width: 60, price: 900, category: 'תחתונים', modelSlug: 'three-drawers-60' },
  { id: 'p8', name: 'ארון עליון 100 ס"מ - קלאפה', subtitle: 'דלת קלאפה', width: 100, price: 550, category: 'עליונים', modelSlug: 'klappa-100' },
  { id: 'p9', name: 'ארון עליון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 470, category: 'עליונים', modelSlug: 'upper-60' },
  { id: 'p10', name: 'ארון גבוה 60 ס"מ - מזווה', subtitle: 'חזית דלת', width: 60, price: 1540, category: 'גבוהים', modelSlug: 'pantry-60-v1' },
  { id: 'p11', name: 'ארון גבוה 60 ס"מ - מזווה פרימיום', subtitle: 'חזית מעוצבת', width: 60, price: 2000, category: 'גבוהים', modelSlug: 'pantry-60-v2' },
  { id: 'p12', name: 'ארון כיור 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 1350, category: 'כיור' },
  { id: 'p13', name: 'ארון כיור 80 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 80, price: 1550, category: 'כיור' },
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
  onContact: () => void
}

const Chevron: FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`cfg__chevron${open ? ' cfg__chevron--open' : ''}`}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function categoryLabel(cats: CabinetCategory[]) {
  if (cats.length === 0) return 'בחרו ארונות'
  if (cats.length <= 2) return cats.join(', ')
  return `${cats[0]}, ${cats[1]} (+${cats.length - 2})`
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

export const ActionButton: FC<ActionButtonProps> = ({ resetAll, onContact }) => {

  return (
    <div className="cfg__cart-footer">
      <button className="cfg__reset-btn" onClick={resetAll}>איפוס</button>
      <button className="cfg__outline-btn" onClick={onContact}>שמירת תכנון ויצרות קשר</button>
      <button className="cfg__buy-btn">לרכישת המטבח</button>
    </div>
  )
}

const ContactPopup: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="cfg__contact-popup" role="dialog" aria-modal="true">
      <button className="cfg__contact-close" onClick={onClose} aria-label="סגור">×</button>
      <h3 className="cfg__contact-title">שמירת תכנון ויצירת קשר</h3>
      <p className="cfg__contact-text">בואו לדבר איתי ולהתייעץ בנוגע לעיצוב שלכם :)</p>
      <div className="cfg__contact-actions">
        <button className="cfg__outline-btn" onClick={onClose}>לא עכשיו, תודה</button>
        <button className="cfg__buy-btn" onClick={() => { onClose(); navigate('/contact') }}>
          יצירת קשר
        </button>
      </div>
    </div>
  )
}

export default function Configurator() {
  const [wallLength, setWallLength] = useState('')
  const [appliedWallLength, setAppliedWallLength] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState('cream')
  const [selectedCategories, setSelectedCategories] = useState<CabinetCategory[]>(['תחתונים'])
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART)
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D')
  const [hoverColor, setHoverColor] = useState<string | null>(null)
  const [howOpen, setHowOpen] = useState(true)
  const [catMenuOpen, setCatMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const { isInWishlist, toggleWishlist } = useWishlist()

  const filteredProducts = PRODUCTS.filter(p => selectedCategories.includes(p.category))
  const colorHex = COLORS.find(c => c.id === selectedColor)?.hex ?? '#C8AE8A'
  const totalCabinetWidth = cartItems
    .filter(item => item.category !== 'עליונים')
    .reduce((sum, item) => sum + item.width * item.qty, 0)
  const exceedsWall = appliedWallLength != null && totalCabinetWidth > appliedWallLength

  function toggleCategory(cat: CabinetCategory) {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        const next = prev.filter(c => c !== cat)
        return next.length === 0 ? prev : next
      }
      return [...prev, cat]
    })
  }

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
    setAppliedWallLength(null)
  }

  function applyWallLength() {
    const parsed = Number(wallLength)
    if (Number.isFinite(parsed) && parsed > 0) {
      setAppliedWallLength(parsed)
    }
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
                onKeyDown={e => e.key === 'Enter' && applyWallLength()}
              />
              <button className="cfg__wall-update" onClick={applyWallLength}>עדכן</button>
            </div>
            {exceedsWall && (
              <p className="cfg__wall-warning">
                ⚠ סך רוחב הארונות שבחרתם ({totalCabinetWidth} ס"מ) חורג מאורך הקיר שהזנתם ({appliedWallLength} ס"מ)
              </p>
            )}
          </div>
        </div>

        {/* LEFT side (RTL end — second in DOM): how-to steps */}
        <div className="cfg__steps">
          <button
            type="button"
            className="cfg__steps-hdr"
            onClick={() => setHowOpen(o => !o)}
            aria-expanded={howOpen}
          >
            <span className="cfg__steps-label">איך זה עובד?</span>
            <Chevron open={howOpen} />
          </button>
          <ol className={`cfg__steps-list${howOpen ? '' : ' cfg__steps-list--closed'}`}>
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
                className={`cfg__tab${selectedCategories.length === 1 && selectedCategories[0] === cat ? ' cfg__tab--on' : ''}`}
                onClick={() => setSelectedCategories([cat])}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="cfg__cat-dropdown">
            <button
              type="button"
              className="cfg__cat-dropdown-btn"
              onClick={() => setCatMenuOpen(o => !o)}
              aria-expanded={catMenuOpen}
            >
              <Chevron open={catMenuOpen} />
              <span>{categoryLabel(selectedCategories)}</span>
            </button>
            {catMenuOpen && (
              <>
                <div className="cfg__cat-backdrop" onClick={() => setCatMenuOpen(false)} />
                <div className="cfg__cat-menu">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="cfg__cat-option">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
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
                  data-label={c.label}
                />
                {hoverColor === c.id && (
                  <span className="cfg__color-tip">{c.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>



        <div className="cfg__actions cfg__actions--desktop">
          <ActionButton resetAll={resetAll} onContact={() => setContactOpen(true)} />
        </div>
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
                <button
                  type="button"
                  className={`cfg__product-heart${isInWishlist(product.id) ? ' cfg__product-heart--on' : ''}`}
                  aria-label={isInWishlist(product.id) ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}
                  onClick={e => {
                    e.stopPropagation()
                    toggleWishlist({
                      id: product.id,
                      name: product.name,
                      subtitle: product.subtitle,
                      price: product.price,
                    })
                  }}
                >
                  <HeartIcon filled={isInWishlist(product.id)} />
                </button>
                <div className="cfg__product-swatch" style={{ background: colorHex }} />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER panel: visualization canvas */}
        <div className="cfg__canvas">
          {viewMode === '3D' ? (
            <div className="cfg__canvas-area">
              <KitchenModelViewer cartItems={cartItems} colorHex={colorHex} colorId={selectedColor} wallLengthCm={appliedWallLength} />
            </div>
          ) : (
            <div
              className="cfg__canvas-area"
              style={{ backgroundImage: `url(${sketch})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
            />
          )}
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

          <div className="cfg__actions cfg__actions--mobile">
            <ActionButton resetAll={resetAll} onContact={() => setContactOpen(true)} />
          </div>
        </div>

      </div>

      <ContactPopup open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
