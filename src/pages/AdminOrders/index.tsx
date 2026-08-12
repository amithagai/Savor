import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import './AdminOrders.css'
import { useAdminAuth } from '../../context/useAdminAuth'
import { ApiError, api } from '../../lib/api'

type OrderStatus = 'CREATED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
type PaymentOutcome = 'expired' | 'failed'
type OrderFilter = OrderStatus | 'PAYMENT_EXPIRED' | 'PAYMENT_FAILED' | 'INVENTORY_SHORTAGE' | 'ALL'
type DateFilter = 'ALL' | 'TODAY' | 'WEEK'

type ShippingAddress = {
  full_name?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  region?: string
  apartment?: string
  id_number?: string
  zip_code?: string
  notes?: string
  delivery_method?: 'pickup' | 'delivery'
  wants_installation?: boolean
  delivery_fee?: number
  installation_fee?: number
}

type OrderItem = {
  id: string
  quantity: number
  unit_price_snapshot: number
  line_total: number
  product_snapshot: {
    product_id?: string
    configuration_id?: string
    configuration_type?: string
    name?: string
    product_name?: string
    variant_id?: string
    variant_sku?: string
    variant_color_label?: string
    selected_components?: Array<Record<string, unknown>>
  }
}

type InventoryShortage = {
  inventory_item_id?: string | null
  sku?: string | null
  product_name?: string | null
  requested_quantity: number
  available_quantity: number
  shortage_quantity: number
  reason: 'insufficient_stock' | 'inventory_record_missing'
}

type Order = {
  id: string
  order_number: number
  status: OrderStatus
  shipping_address: ShippingAddress
  subtotal_snapshot: number
  total_snapshot: number
  payment_provider?: string | null
  payment_reference?: string | null
  payment_outcome?: PaymentOutcome | null
  inventory_shortage_at?: string | null
  inventory_shortage_details: InventoryShortage[]
  items: OrderItem[]
  created_at: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'ממתינה לתשלום',
  PAID: 'שולמה',
  PROCESSING: 'בטיפול',
  SHIPPED: 'נשלחה',
  DELIVERED: 'נמסרה',
  CANCELLED: 'בוטלה',
}

const STATUS_ORDER: OrderStatus[] = ['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_TONES: Record<OrderStatus, string> = {
  CREATED: 'waiting',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

const PAYMENT_OUTCOME_LABELS: Record<PaymentOutcome, string> = {
  expired: 'התשלום לא הושלם',
  failed: 'התשלום נכשל',
}

function orderStatusLabel(order: Order) {
  if (order.status === 'CANCELLED' && order.payment_outcome) {
    return PAYMENT_OUTCOME_LABELS[order.payment_outcome]
  }
  return STATUS_LABELS[order.status]
}

function orderStatusTone(order: Order) {
  if (order.status === 'CANCELLED' && order.payment_outcome === 'expired') return 'expired'
  if (order.status === 'CANCELLED' && order.payment_outcome === 'failed') return 'failed'
  return STATUS_TONES[order.status]
}

function formatMoney(value: number) {
  return `${value.toLocaleString('he-IL')} ₪`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function csvCell(value: unknown) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function itemName(item: OrderItem, index: number) {
  return item.product_snapshot.product_name
    || item.product_snapshot.name
    || (item.product_snapshot.configuration_type === 'STANDARD' ? 'מטבח מוכן' : '')
    || `פריט ${index + 1}`
}

function variantDetails(item: OrderItem) {
  const snapshot = item.product_snapshot
  const selectedVariant = snapshot.selected_components?.find(
    (component) => component.selection_type === 'product_variant',
  )
  const selectedColor = selectedVariant?.color_label
  const selectedSku = selectedVariant?.sku
  const color = snapshot.variant_color_label
    || (typeof selectedColor === 'string' ? selectedColor : '')
  const sku = snapshot.variant_sku
    || (typeof selectedSku === 'string' ? selectedSku : '')

  return [color && `צבע ${color}`, sku && `מק״ט ${sku}`].filter(Boolean).join(' · ')
}

export default function AdminOrders() {
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadOrders = async (showLoading = false) => {
      if (showLoading) setLoading(true)
      try {
        const data = await api.get<Order[]>('/admin/orders', token)
        if (!cancelled) setOrders(data)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/admin/login')
          return
        }
        if (!cancelled) setError('טעינת ההזמנות נכשלה')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadOrders(true)
    const refreshId = window.setInterval(() => { void loadOrders() }, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(refreshId)
    }
  }, [token, logout, navigate])

  const statusCounts = useMemo(() => STATUS_ORDER.reduce<Record<OrderStatus, number>>(
    (counts, status) => ({
      ...counts,
      [status]: orders.filter((order) => (
        order.status === status && (status !== 'CANCELLED' || !order.payment_outcome)
      )).length,
    }),
    { CREATED: 0, PAID: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 },
  ), [orders])

  const paymentOutcomeCounts = useMemo(() => ({
    expired: orders.filter((order) => order.status === 'CANCELLED' && order.payment_outcome === 'expired').length,
    failed: orders.filter((order) => order.status === 'CANCELLED' && order.payment_outcome === 'failed').length,
  }), [orders])
  const inventoryShortageCount = useMemo(
    () => orders.filter((order) => Boolean(order.inventory_shortage_at)).length,
    [orders],
  )

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('he')
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000

    return orders.filter((order) => {
      const address = order.shipping_address || {}
      const createdAt = new Date(order.created_at).getTime()
      const matchesStatus = filter === 'ALL'
        || (filter === 'INVENTORY_SHORTAGE'
          ? Boolean(order.inventory_shortage_at)
          : filter === 'PAYMENT_EXPIRED'
          ? order.status === 'CANCELLED' && order.payment_outcome === 'expired'
          : filter === 'PAYMENT_FAILED'
            ? order.status === 'CANCELLED' && order.payment_outcome === 'failed'
            : filter === 'CANCELLED'
              ? order.status === 'CANCELLED' && !order.payment_outcome
              : order.status === filter)
      const matchesDate = dateFilter === 'ALL'
        || (dateFilter === 'TODAY' ? createdAt >= todayStart : createdAt >= weekStart)
      const haystack = [order.order_number, order.id, address.full_name, address.phone, address.email, address.city]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('he')
      return matchesStatus && matchesDate && (!normalized || haystack.includes(normalized))
    })
  }, [orders, filter, dateFilter, query])

  const activeRevenue = useMemo(
    () => orders.filter((order) => !['CREATED', 'CANCELLED'].includes(order.status)).reduce((sum, order) => sum + order.total_snapshot, 0),
    [orders],
  )

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    if (status === order.status) return
    if (status === 'CANCELLED' && !window.confirm('לבטל את ההזמנה? ניתן יהיה לשנות את הסטטוס שוב מאוחר יותר.')) return
    setStatusSaving(order.id)
    setError('')
    setNotice('')
    try {
      const updated = await api.patch<Order>(`/admin/orders/${order.id}/status`, { status }, token)
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item))
      setNotice(`הזמנה #${order.order_number} עודכנה לסטטוס “${STATUS_LABELS[status]}”`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/admin/login')
        return
      }
      setError('עדכון סטטוס ההזמנה נכשל')
    } finally {
      setStatusSaving(null)
    }
  }

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId)
      setCopiedId(orderId)
      window.setTimeout(() => setCopiedId((current) => current === orderId ? null : current), 1800)
    } catch {
      setError('העתקת מספר ההזמנה נכשלה')
    }
  }

  const downloadCsv = () => {
    const header = ['מספר הזמנה', 'תאריך', 'שם לקוח', 'טלפון', 'אימייל', 'עיר', 'סטטוס', 'סכום']
    const rows = visibleOrders.map((order) => [
      order.order_number,
      formatDate(order.created_at),
      order.shipping_address?.full_name,
      order.shipping_address?.phone,
      order.shipping_address?.email,
      order.shipping_address?.city,
      orderStatusLabel(order),
      order.total_snapshot,
    ])
    const content = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}`
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `savor-orders-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-orders">
      <header className="admin-orders__heading">
        <div><h1>הזמנות</h1><p>מעקב, טיפול ועדכון הזמנות במקום אחד</p></div>
        <button type="button" className="admin-orders__export" onClick={downloadCsv} disabled={visibleOrders.length === 0}>הורדת CSV</button>
      </header>

      <section className="admin-orders__summary" aria-label="סיכום הזמנות">
        <SummaryCard label="כל ההזמנות" value={orders.length.toLocaleString('he-IL')} />
        <SummaryCard label="ממתינות לטיפול" value={(statusCounts.PAID + statusCounts.PROCESSING).toLocaleString('he-IL')} tone="attention" />
        <SummaryCard label="נשלחו או נמסרו" value={(statusCounts.SHIPPED + statusCounts.DELIVERED).toLocaleString('he-IL')} tone="positive" />
        <SummaryCard label="הכנסות מהזמנות פעילות" value={formatMoney(activeRevenue)} />
        <SummaryCard label="חריגות מלאי לטיפול" value={inventoryShortageCount.toLocaleString('he-IL')} tone={inventoryShortageCount ? 'danger' : ''} />
      </section>

      <section className="admin-orders__payment-policy" aria-label="מדיניות תשלומים שלא הושלמו">
        <span className="admin-orders__payment-policy-icon" aria-hidden="true">i</span>
        <div>
          <strong>טיפול אוטומטי בתשלומים</strong>
          <p>הזמנה שלא מתקבל עבורה אישור תשלום בתוך 30 דקות מסומנת אוטומטית כ״התשלום לא הושלם״. אישור מאוחר מ־HYP תמיד יעדכן אותה ל״שולמה״.</p>
        </div>
        {(paymentOutcomeCounts.expired + paymentOutcomeCounts.failed) > 0 && (
          <span className="admin-orders__payment-policy-count">
            {paymentOutcomeCounts.expired + paymentOutcomeCounts.failed} הזמנות
          </span>
        )}
      </section>

      <section className="admin-orders__toolbar">
        <label className="admin-orders__search">
          <span>חיפוש</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="מספר הזמנה, שם, טלפון או אימייל" type="search" />
        </label>
        <label className="admin-orders__date-filter">
          <span>תקופה</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="ALL">כל התקופות</option>
            <option value="TODAY">היום</option>
            <option value="WEEK">7 ימים אחרונים</option>
          </select>
        </label>
      </section>

      <div className="admin-orders__filters">
        <button type="button" className={filter === 'ALL' ? 'is-active' : ''} onClick={() => setFilter('ALL')}>הכל <span>{orders.length}</span></button>
        {STATUS_ORDER.map((status) => (
          <button type="button" key={status} className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)}>
            {STATUS_LABELS[status]} <span>{statusCounts[status]}</span>
          </button>
        ))}
        <button type="button" className={filter === 'PAYMENT_EXPIRED' ? 'is-active' : ''} onClick={() => setFilter('PAYMENT_EXPIRED')}>
          התשלום לא הושלם <span>{paymentOutcomeCounts.expired}</span>
        </button>
        <button type="button" className={filter === 'PAYMENT_FAILED' ? 'is-active' : ''} onClick={() => setFilter('PAYMENT_FAILED')}>
          התשלום נכשל <span>{paymentOutcomeCounts.failed}</span>
        </button>
        <button type="button" className={filter === 'INVENTORY_SHORTAGE' ? 'is-active' : ''} onClick={() => setFilter('INVENTORY_SHORTAGE')}>
          חריגות מלאי <span>{inventoryShortageCount}</span>
        </button>
      </div>

      {notice && <p className="admin-orders__notice admin-orders__notice--success">{notice}</p>}
      {error && <p className="admin-orders__notice admin-orders__notice--error">{error}</p>}
      {loading && <p className="admin-orders__state">טוען הזמנות…</p>}
      {!loading && visibleOrders.length === 0 && <p className="admin-orders__state">לא נמצאו הזמנות שתואמות לסינון.</p>}

      {!loading && visibleOrders.length > 0 && (
        <div className="admin-orders__list">
          {visibleOrders.map((order) => {
            const address = order.shipping_address || {}
            const isOpen = expandedId === order.id
            return (
              <article className={`admin-orders__card ${isOpen ? 'is-open' : ''}${order.inventory_shortage_at ? ' has-inventory-shortage' : ''}`} key={order.id}>
                <button type="button" className="admin-orders__row" onClick={() => setExpandedId(isOpen ? null : order.id)} aria-expanded={isOpen}>
                  <span className="admin-orders__chevron" aria-hidden="true">⌄</span>
                  <span className="admin-orders__identity">
                    <strong>{address.full_name || 'ללא שם'}</strong>
                    <small>#{order.order_number} · {address.phone || 'ללא טלפון'}</small>
                    {order.inventory_shortage_at && <em>חריגת מלאי — נדרש קשר עם הלקוחה</em>}
                  </span>
                  <span className="admin-orders__row-date">{formatDate(order.created_at)}</span>
                  <span className={`admin-orders__badge admin-orders__badge--${orderStatusTone(order)}`}>{orderStatusLabel(order)}</span>
                  <strong className="admin-orders__row-total">{formatMoney(order.total_snapshot)}</strong>
                </button>

                {isOpen && (
                  <div className="admin-orders__detail">
                    {order.inventory_shortage_at && (
                      <section className="admin-orders__inventory-warning" role="alert">
                        <div>
                          <strong>התשלום אושר, אך חסר מלאי להזמנה</strong>
                          <p>יש ליצור קשר עם הלקוחה ולתאם מועד אספקה או פתרון חלופי.</p>
                          {!!order.inventory_shortage_details?.length && (
                            <ul>
                              {order.inventory_shortage_details.map((shortage, index) => (
                                <li key={`${shortage.inventory_item_id || shortage.sku || 'shortage'}-${index}`}>
                                  {shortage.product_name || 'מוצר'} · מק״ט {shortage.sku || 'לא זמין'} · חסרות {shortage.shortage_quantity} יחידות
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {address.phone && <a href={`tel:${address.phone}`}>חיוג ללקוחה</a>}
                      </section>
                    )}
                    <div className="admin-orders__detail-grid">
                      <DetailSection title="פרטי לקוח">
                        <DetailLine label="שם" value={address.full_name} />
                        <DetailLine label="טלפון" value={address.phone} href={address.phone ? `tel:${address.phone}` : undefined} />
                        <DetailLine label="אימייל" value={address.email} href={address.email ? `mailto:${address.email}` : undefined} />
                        <DetailLine label="תעודת זהות" value={address.id_number} />
                      </DetailSection>
                      <DetailSection title="משלוח והתקנה">
                        <DetailLine label="אופן קבלה" value={address.delivery_method === 'delivery' ? 'משלוח' : address.delivery_method === 'pickup' ? 'איסוף עצמי' : undefined} />
                        <DetailLine label="כתובת" value={[address.street, address.apartment && `דירה ${address.apartment}`, address.city, address.region, address.zip_code].filter(Boolean).join(', ')} />
                        <DetailLine label="התקנה" value={address.wants_installation ? 'כולל התקנה' : 'ללא התקנה'} />
                        <DetailLine label="הערות" value={address.notes} />
                      </DetailSection>
                      <DetailSection title="תשלום">
                        <DetailLine label="ספק" value={order.payment_provider || (order.status === 'CREATED' ? 'טרם נבחר' : 'לא ידוע')} />
                        <DetailLine label="סטטוס" value={orderStatusLabel(order)} />
                        <DetailLine label="סכום מוצרים" value={formatMoney(order.subtotal_snapshot)} />
                        <DetailLine label="משלוח" value={formatMoney(address.delivery_fee || 0)} />
                        {address.wants_installation && <DetailLine label="התקנה (תשלום נפרד למתקין)" value={formatMoney(address.installation_fee || 0)} />}
                      </DetailSection>
                    </div>

                    <section className="admin-orders__items-section">
                      <h3>פריטים בהזמנה</h3>
                      <div className="admin-orders__items">
                        {order.items.map((item, index) => (
                          <div className="admin-orders__item" key={item.id}>
                            <span className="admin-orders__item-index">{index + 1}</span>
                            <span className="admin-orders__item-name">
                              <strong>{itemName(item, index)}</strong>
                              <small>{item.product_snapshot.product_id ? `מוצר ${item.product_snapshot.product_id.slice(0, 8)}` : 'מוצר מותאם אישית'}</small>
                              {variantDetails(item) && <small>{variantDetails(item)}</small>}
                            </span>
                            <span>{item.quantity} × {formatMoney(item.unit_price_snapshot)}</span>
                            <strong>{formatMoney(item.line_total)}</strong>
                          </div>
                        ))}
                        <div className="admin-orders__grand-total"><span>סה״כ הזמנה</span><strong>{formatMoney(order.total_snapshot)}</strong></div>
                      </div>
                    </section>

                    <footer className="admin-orders__actions">
                      <label><span>עדכון סטטוס</span><select value={order.status} disabled={statusSaving === order.id} onChange={(event) => handleStatusChange(order, event.target.value as OrderStatus)}>{STATUS_ORDER.map((status) => <option key={status} value={status}>{status === 'CANCELLED' && order.payment_outcome ? orderStatusLabel(order) : STATUS_LABELS[status]}</option>)}</select></label>
                      {statusSaving === order.id && <span className="admin-orders__saving">שומר…</span>}
                      <button type="button" className="admin-orders__copy" onClick={() => copyOrderId(String(order.order_number))}>{copiedId === String(order.order_number) ? 'הועתק' : 'העתקת מספר הזמנה'}</button>
                    </footer>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return <div className={`admin-orders__summary-card ${tone ? `admin-orders__summary-card--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong></div>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="admin-orders__detail-section"><h3>{title}</h3><div>{children}</div></section>
}

function DetailLine({ label, value, href }: { label: string; value?: string; href?: string }) {
  const display = value || '—'
  return <p><span>{label}</span>{href ? <a href={href}>{display}</a> : <strong>{display}</strong>}</p>
}
