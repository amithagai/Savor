import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import './Configurator.css'
import HeartIcon from '../../components/HeartIcon'
import { useWishlist } from '../../context/useWishlist'
import { useCart } from '../../context/useCart'
import KitchenModelViewer from './KitchenModelViewer'
import Configurator2DView from './Configurator2DView'
import ProductThumbnail from './ProductThumbnail'
import { COLORS, colorHexOf, colorIdOf, colorLabelOf, colorSwatchStyleOf, knownColorHexOf } from './colors'
import { availableColorsFor } from './modelCatalog'
import type { AccessoryPositions, CabinetCategory, CabinetPositions, KitchenAccessoryId } from './cabinetLayout'
import { api } from '../../lib/api'
import type { ConfiguratorProduct } from '../../types/catalog'
import { useSiteContent } from '../../hooks/useSiteContent'
import type { FooterContent } from '../../types/content'

type ConfiguratorCategory = CabinetCategory | 'ברז'

type CabinetProduct = {
  id: string
  name: string
  subtitle: string
  width: number
  price: number
  pricesByColor?: Partial<Record<string, number>>
  category: ConfiguratorCategory
  modelSlug?: string
  variants?: CabinetProductVariant[]
}

type CabinetProductVariant = {
  variantId?: string
  colorId: string
  colorLabel: string
  price: number
  originalPrice?: number
  sku?: string
  modelUrl?: string
  thumbnailUrl?: string
  colorHex?: string
  inventoryTracking?: boolean
  availableQuantity?: number
  inStock?: boolean
  allowPreorder?: boolean
}

type CartItem = CabinetProduct & CabinetProductVariant & { qty: number }

const CATEGORIES: ConfiguratorCategory[] = ['עליונים', 'גבוהים', 'תחתונים', 'כיור', 'ברז']

const FALLBACK_PRODUCTS: CabinetProduct[] = [
  { id: 'p1', name: 'ארון תנור 60 ס"מ', subtitle: 'יחידת תנור', width: 60, price: 670, category: 'תחתונים', modelSlug: 'oven-60' },
  { id: 'p2', name: 'ארון תחתון 30 ס"מ - מדף ומגירה', subtitle: 'מדף ומגירה', width: 30, price: 660, category: 'תחתונים', modelSlug: 'shelf-drawer-30' },
  { id: 'p3', name: 'ארון תחתון 60 ס"מ - מדף ומגירה', subtitle: 'מדף ומגירה', width: 60, price: 770, category: 'תחתונים', modelSlug: 'shelf-drawer-60' },
  { id: 'p4', name: 'ארון תחתון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 600, category: 'תחתונים', modelSlug: 'base-60-2door' },
  { id: 'p5', name: 'ארון תחתון 60 ס"מ - חזית דלת', subtitle: 'חזית דלת', width: 60, price: 640, category: 'תחתונים', modelSlug: 'base-60-1door' },
  { id: 'p6', name: 'ארון תחתון 80 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 80, price: 740, category: 'תחתונים', modelSlug: 'base-80-2door' },
  { id: 'p7', name: 'ארון תחתון 60 ס"מ - שלוש מגירות', subtitle: 'שלוש מגירות', width: 60, price: 900, category: 'תחתונים', modelSlug: 'three-drawers-60' },
  { id: 'p8', name: 'ארון עליון 100 ס"מ - קלאפה', subtitle: 'דלת קלאפה', width: 100, price: 550, category: 'עליונים', modelSlug: 'klappa-100' },
  { id: 'p9', name: 'ארון עליון 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 470, category: 'עליונים', modelSlug: 'upper-60' },
  { id: 'p10', name: 'ארון גבוה 60 ס"מ - מזווה', subtitle: 'דלת מזווה מלאה', width: 60, price: 2000, pricesByColor: { latte: 2330 }, category: 'גבוהים', modelSlug: 'pantry-60-v2' },
  { id: 'p12', name: 'ארון כיור 60 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 60, price: 1350, category: 'כיור' },
  { id: 'p13', name: 'ארון כיור 80 ס"מ - חזית 2 דלתות', subtitle: 'חזית 2 דלתות', width: 80, price: 1550, category: 'כיור' },
]

const HOW_STEPS = [
  'בוחרים את המידה: מתחילים מהגדרת אורך הקיר של המטבח שלכם.',
  'בוחרים רהיטים ובנייתם: בוחרים את יחידות המתאימות (ארונות תחתונים, עליונים או ארונות גבוהים) ולפשוט אותם גורמים לתוך ההדמיה.',
  'משלימים את העיצוב: בודקים שהכל ישבב במקום, רואים את התוצאה הסופית, ויכולים להתקדם להזמנה!',
]

const INITIAL_CART: CartItem[] = [
  { ...FALLBACK_PRODUCTS[0], qty: 1, colorId: 'cream', colorLabel: 'CREAM', price: FALLBACK_PRODUCTS[0].price },
  { ...FALLBACK_PRODUCTS[1], qty: 1, colorId: 'cream', colorLabel: 'CREAM', price: FALLBACK_PRODUCTS[1].price },
  { ...FALLBACK_PRODUCTS[2], qty: 1, colorId: 'cream', colorLabel: 'CREAM', price: FALLBACK_PRODUCTS[2].price },
]

const DEFAULT_WHATSAPP_PHONE = '972509072335'

function normalizeWhatsAppPhone(value?: string | null) {
  let digits = (value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `972${digits.slice(1)}`
  return /^\d{10,15}$/.test(digits) ? digits : null
}

function phoneFromWhatsAppUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    const match = url.hostname.toLowerCase() === 'wa.me' ? url.pathname.match(/^\/(\d+)\/?$/) : null
    return normalizeWhatsAppPhone(match?.[1])
  } catch {
    return null
  }
}

function buildWhatsAppPlanMessage(cartItems: CartItem[], wallLengthCm: number | null) {
  const itemLines = cartItems.length > 0
    ? cartItems.map((item) => (
        `• ${item.name} — צבע ${item.colorLabel} — כמות ${item.qty} — ${(item.price * item.qty).toLocaleString('he-IL')} ₪`
      ))
    : ['• לא נבחרו פריטים']
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  return [
    'שלום, בניתי תכנון מטבח באתר Savor:',
    '',
    `אורך הקיר: ${wallLengthCm != null ? `${wallLengthCm.toLocaleString('he-IL')} ס״מ` : 'לא הוגדר'}`,
    '',
    'הפריטים שבחרתי:',
    ...itemLines,
    '',
    `סה״כ משוער: ${total.toLocaleString('he-IL')} ₪`,
    '',
    'אשמח לקבל ייעוץ לגבי התכנון.',
  ].join('\n')
}
interface ActionButtonProps {
  resetAll: () => void
  contactHref: string
  onBuy: () => void
  buyDisabled: boolean
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

function categoryLabel(cats: ConfiguratorCategory[]) {
  if (cats.length === 0) return 'בחרו פריטים'
  if (cats.length <= 2) return cats.join(', ')
  return `${cats[0]}, ${cats[1]} (+${cats.length - 2})`
}

function priceFor(product: CabinetProduct, colorId: string) {
  const variant = product.variants?.find((item) => item.colorId === colorId)
  if (variant) return variant.price
  return product.pricesByColor?.[colorId] ?? product.price
}

function variantsFor(product: CabinetProduct): CabinetProductVariant[] {
  if (product.variants?.length) return product.variants
  return availableColorsFor(product.modelSlug).map((colorId) => ({
    colorId,
    colorLabel: colorLabelOf(colorId),
    price: priceFor(product, colorId),
  }))
}

function configuratorProductFromApi(product: ConfiguratorProduct): CabinetProduct | null {
  const attributes = product.attributes || {}
  const category = String(attributes.configurator_category || '') as ConfiguratorCategory
  const width = Number(attributes.width_cm)
  if (!CATEGORIES.includes(category) || !Number.isFinite(width) || width <= 0 || product.variants.length === 0) return null
  const variants = product.variants.map((variant) => ({
    variantId: variant.id,
    colorId: colorIdOf(variant.color_id, variant.color_label),
    colorLabel: variant.color_label,
    price: variant.sale_price ?? variant.price,
    originalPrice: variant.sale_price != null ? variant.price : undefined,
    sku: variant.sku,
    modelUrl: variant.model_url,
    thumbnailUrl: variant.thumbnail_url || undefined,
    colorHex: typeof variant.attributes?.color_hex === 'string' ? variant.attributes.color_hex : undefined,
    inventoryTracking: variant.inventory_tracking,
    availableQuantity: variant.available_quantity,
    inStock: variant.in_stock,
    allowPreorder: variant.allow_preorder,
  }))
  return {
    id: product.id,
    name: product.name,
    subtitle: String(attributes.configurator_subtitle || product.name),
    width,
    price: Math.min(...variants.map((variant) => variant.price)),
    category,
    variants,
  }
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

export const ActionButton: FC<ActionButtonProps> = ({ resetAll, contactHref, onBuy, buyDisabled }) => {

  return (
    <div className="cfg__cart-footer">
      <button className="cfg__reset-btn" onClick={resetAll}>איפוס</button>
      <a className="cfg__outline-btn cfg__contact-link" href={contactHref} target="_blank" rel="noopener noreferrer">
        שמירת תכנון ויצירת קשר
      </a>
      <button
        className="cfg__buy-btn"
        onClick={onBuy}
        disabled={buyDisabled}
        title={buyDisabled ? 'הרכישה זמינה לאחר פרסום מוצרי הקונפיגורטור' : undefined}
      >
        לרכישת המטבח
      </button>
    </div>
  )
}

export default function Configurator() {
  const navigate = useNavigate()
  const { data: footerContent } = useSiteContent<FooterContent>('footer')
  const [wallLength, setWallLength] = useState('')
  const [appliedWallLength, setAppliedWallLength] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<ConfiguratorCategory[]>(['תחתונים'])
  const [selectedColors, setSelectedColors] = useState<string[]>(['latte', 'timber'])
  const [products, setProducts] = useState<CabinetProduct[]>(FALLBACK_PRODUCTS)
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART)
  const [cabinetPositions, setCabinetPositions] = useState<CabinetPositions>({})
  const [accessories, setAccessories] = useState<AccessoryPositions>({})
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D')
  const [howOpen, setHowOpen] = useState(true)
  const [catMenuOpen, setCatMenuOpen] = useState(false)
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addItemsToCart } = useCart()

  useEffect(() => {
    let cancelled = false
    api.get<ConfiguratorProduct[]>('/catalog/configurator-products')
      .then((response) => response.map(configuratorProductFromApi).filter((product): product is CabinetProduct => product !== null))
      .then((adminProducts) => {
        if (cancelled || adminProducts.length === 0) return
        setProducts(adminProducts)
        const ids = new Set(adminProducts.map((product) => product.id))
        setCartItems((current) => current.filter((item) => ids.has(item.id)))
      })
      .catch(() => {
        // The hard-coded catalog remains a safe development/legacy fallback
        // until the admin has published its first configurator products.
      })
    return () => { cancelled = true }
  }, [])

  const filteredProducts = products.filter(p => selectedCategories.includes(p.category))
  const cabinetCartItems = cartItems.filter(
    (item): item is CartItem & { category: CabinetCategory } => item.category !== 'ברז',
  )
  const totalCabinetWidth = cabinetCartItems
    .filter(item => item.category !== 'עליונים')
    .reduce((sum, item) => sum + item.width * item.qty, 0)
  const counterCabinetWidth = cabinetCartItems
    .filter(item => item.category !== 'עליונים' && item.category !== 'גבוהים')
    .reduce((sum, item) => sum + item.width * item.qty, 0)
  const hasSelectedFaucet = cartItems.some(item => item.category === 'ברז')
  const visibleAccessories: AccessoryPositions = { ...accessories }
  if (hasSelectedFaucet) {
    const availableWidth = appliedWallLength ?? counterCabinetWidth
    const center = Math.max(30, availableWidth / 2)
    visibleAccessories.faucet ??= Math.min(Math.max(4, availableWidth - 4), center + 20)
  } else {
    delete visibleAccessories.faucet
  }
  const exceedsWall = appliedWallLength != null && totalCabinetWidth > appliedWallLength
  const canBuyKitchen = cartItems.length > 0 && cartItems.every((item) => Boolean(item.variantId))
  const whatsappPhone = normalizeWhatsAppPhone(footerContent?.whatsapp_phone)
    || phoneFromWhatsAppUrl(footerContent?.whatsapp_url)
    || DEFAULT_WHATSAPP_PHONE
  const whatsappMessage = buildWhatsAppPlanMessage(cartItems, appliedWallLength)
  const whatsappContactHref = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`

  function toggleCategory(cat: ConfiguratorCategory) {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        const next = prev.filter(c => c !== cat)
        return next.length === 0 ? prev : next
      }
      return [...prev, cat]
    })
  }

  function toggleColor(colorId: string) {
    setSelectedColors((current) => {
      if (!current.includes(colorId)) return [...current, colorId]
      if (current.length === 1) return current
      return current.filter((selectedColor) => selectedColor !== colorId)
    })
  }

  function addToCart(product: CabinetProduct, variant: CabinetProductVariant) {
    if (variant.inStock === false && !variant.allowPreorder) return
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.colorId === variant.colorId)
      if (existing) {
        if (variant.inventoryTracking && !variant.allowPreorder && existing.qty >= (variant.availableQuantity ?? 0)) return prev
        return prev.map(item =>
          item.id === product.id && item.colorId === variant.colorId
            ? { ...item, ...variant, qty: item.qty + 1 }
            : item
        )
      }
      return [...prev, { ...product, ...variant, qty: 1 }]
    })
  }

  function setQty(id: string, colorId: string, qty: number) {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(item => !(item.id === id && item.colorId === colorId)))
    } else {
      setCartItems(prev => prev.map(item => {
        if (item.id !== id || item.colorId !== colorId) return item
        const maximum = item.inventoryTracking && !item.allowPreorder ? item.availableQuantity ?? 0 : 10
        return { ...item, qty: Math.min(qty, maximum) }
      }))
    }
  }

  function resetAll() {
    setCartItems([])
    setCabinetPositions({})
    setAccessories({})
    setWallLength('')
    setAppliedWallLength(null)
  }

  function buyKitchen() {
    if (!canBuyKitchen) return

    addItemsToCart(cartItems.map((item) => ({
      id: item.id,
      lineId: `${item.id}:${item.variantId}`,
      name: item.name,
      category: item.category,
      size: item.subtitle,
      variant: item.colorLabel,
      variantId: item.variantId,
      quantity: item.qty,
      price: item.price,
      image: item.thumbnailUrl,
      swatchColor: knownColorHexOf(item.colorId, item.colorLabel) || item.colorHex || colorHexOf(item.colorId, item.colorLabel),
      productType: 'CABINET',
    })))
    navigate('/cart')
  }

  function setCabinetPosition(key: string, xCm: number) {
    setCabinetPositions(prev => ({ ...prev, [key]: xCm }))
  }

  function setAccessoryPosition(id: KitchenAccessoryId, xCm: number) {
    setAccessories(prev => ({ ...prev, [id]: xCm }))
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
          <h2 className="cfg__catalog-title">פריטים</h2>
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
          <div className="cfg__color-dots" role="group" aria-label="סינון מוצרים לפי צבע">
            {COLORS.map((color) => {
              const selected = selectedColors.includes(color.id)
              const isLastSelected = selected && selectedColors.length === 1
              return (
                <span className="cfg__color-wrap" key={color.id}>
                  <button
                    type="button"
                    className={`cfg__color-dot${selected ? ' cfg__color-dot--on' : ''}`}
                    style={colorSwatchStyleOf(color.id, color.label)}
                    onClick={() => toggleColor(color.id)}
                    aria-label={`${selected ? 'הסרת' : 'בחירת'} צבע ${color.label}`}
                    aria-pressed={selected}
                    title={isLastSelected ? 'חובה להשאיר לפחות צבע אחד מסומן' : undefined}
                  />
                  <span className="cfg__color-tip" aria-hidden="true">צבע {color.label}</span>
                </span>
              )
            })}
          </div>
        </div>



        <div className="cfg__actions cfg__actions--desktop">
          <ActionButton
            resetAll={resetAll}
            contactHref={whatsappContactHref}
            onBuy={buyKitchen}
            buyDisabled={!canBuyKitchen}
          />
        </div>
      </div>

      {/* ══════════ MAIN THREE-PANEL ══════════ */}
      <div className="cfg__main">

        {/* RIGHT panel: product catalog (RTL start — first in DOM) */}
        <div className="cfg__catalog">
          <div className="cfg__product-list">
            {filteredProducts.flatMap(product => variantsFor(product)
              .filter((variant) => selectedColors.includes(colorIdOf(variant.colorId, variant.colorLabel)))
              .map(variant => {
              const wishlistId = `${product.id}-${variant.colorId}`
              return (
                <div
                  key={wishlistId}
                  className={`cfg__product${variant.inStock === false && !variant.allowPreorder ? ' cfg__product--out' : ''}`}
                  onClick={() => addToCart(product, variant)}
                  role="button"
                  tabIndex={variant.inStock === false && !variant.allowPreorder ? -1 : 0}
                  onKeyDown={e => e.key === 'Enter' && addToCart(product, variant)}
                >
                  <div className="cfg__product-img">
                    {variant.thumbnailUrl
                      ? <img className="cfg__product-thumbnail cfg__product-thumbnail--photo" src={variant.thumbnailUrl} alt="" />
                      : <ProductThumbnail
                          modelSlug={product.modelSlug}
                          productId={product.id}
                          colorId={variant.colorId}
                          colorHex={variant.colorHex}
                          widthCm={product.width}
                        />}
                  </div>
                  <div className="cfg__product-info">
                    <span className="cfg__product-name">{product.name}</span>
                    <span className="cfg__product-price">
                      {product.width} ס"מ מ- {variant.price.toLocaleString()} ₪
                      {variant.originalPrice != null && <del>{variant.originalPrice.toLocaleString()} ₪</del>}
                    </span>
                    <span className="cfg__product-color-name">{variant.colorLabel}</span>
                    {variant.inStock === false && <span className="cfg__product-stock">
                      {variant.allowPreorder ? 'Pre-order' : 'אזל מהמלאי'}
                    </span>}
                  </div>
                  <button
                    type="button"
                    className={`cfg__product-heart${isInWishlist(wishlistId) ? ' cfg__product-heart--on' : ''}`}
                    aria-label={isInWishlist(wishlistId) ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}
                    onClick={e => {
                      e.stopPropagation()
                      toggleWishlist({
                        id: wishlistId,
                        name: product.name,
                        subtitle: product.subtitle,
                        price: variant.price,
                      })
                    }}
                  >
                    <HeartIcon filled={isInWishlist(wishlistId)} />
                  </button>
                  <div
                    className="cfg__product-swatch"
                    style={colorSwatchStyleOf(variant.colorId, variant.colorLabel, variant.colorHex)}
                    title={`צבע ${variant.colorLabel}`}
                  />
                </div>
              )
            }))}
          </div>
        </div>

        {/* CENTER panel: visualization canvas */}
        <div className="cfg__canvas">
          {viewMode === '3D' ? (
            <div className="cfg__canvas-area">
              <KitchenModelViewer
                cartItems={cabinetCartItems}
                wallLengthCm={appliedWallLength}
                positions={cabinetPositions}
                onPositionChange={setCabinetPosition}
                accessories={visibleAccessories}
                onAccessoryPositionChange={setAccessoryPosition}
              />
            </div>
          ) : (
            <div className="cfg__canvas-area">
              <Configurator2DView
                cartItems={cabinetCartItems}
                wallLengthCm={appliedWallLength}
                positions={cabinetPositions}
                onPositionChange={setCabinetPosition}
                accessories={visibleAccessories}
                onAccessoryPositionChange={setAccessoryPosition}
              />
            </div>
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
          <div className="cfg__drag-hint">גררו ארונות וברזים למיקום הרצוי</div>
        </div>

        {/* LEFT panel: shopping list (RTL end — last in DOM) */}
        <div className="cfg__cart">
          <h2 className="cfg__cart-title">המטבח שלכם</h2>

          <div className="cfg__cart-items">
            {cartItems.length === 0 && (
              <p className="cfg__cart-empty">לחצו על מוצר כדי להוסיף</p>
            )}
            {cartItems.map(item => (
              <div key={`${item.id}-${item.colorId}`} className="cfg__cart-item">
                <div className="cfg__ci-info">
                  <span className="cfg__ci-name">{item.name}</span>
                  <span className="cfg__ci-sub">{item.subtitle} · {item.colorLabel}</span>
                </div>
                <div className="cfg__ci-row">
                  <span className="cfg__ci-price">₪ {item.price.toLocaleString()}</span>
                  <div className="cfg__ci-qty">
                    <select
                      className="cfg__qty-select"
                      value={item.qty}
                      aria-label={`כמות עבור ${item.name}`}
                      onChange={e => setQty(item.id, item.colorId, Number(e.target.value))}
                    >
                      {Array.from({ length: Math.max(1, item.inventoryTracking && !item.allowPreorder ? Math.min(10, item.availableQuantity ?? 0) : 10) }, (_, index) => index + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="cfg__ci-decrease"
                    onClick={() => setQty(item.id, item.colorId, item.qty - 1)}
                    aria-label={item.qty === 1 ? `הסרת ${item.name}` : `הפחתת כמות ${item.name}`}
                    title={item.qty === 1 ? 'הסרת מוצר' : 'הפחתת כמות'}
                  >
                    {item.qty === 1 ? '×' : '−'}
                  </button>
                  <span
                    className="cfg__ci-swatch"
                    style={colorSwatchStyleOf(item.colorId, item.colorLabel, item.colorHex)}
                    aria-label={`צבע ${item.colorLabel}`}
                    role="img"
                  />
                </div>
              </div>
            ))}
          </div>

          <TotalPrice cartItems={cartItems} />

          <div className="cfg__actions cfg__actions--mobile">
            <ActionButton
              resetAll={resetAll}
              contactHref={whatsappContactHref}
              onBuy={buyKitchen}
              buyDisabled={!canBuyKitchen}
            />
          </div>
        </div>

      </div>

    </div>
  )
}
