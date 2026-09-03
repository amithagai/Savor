import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import './AdminInventory.css'
import { ApiError, api } from '../../lib/api'
import { adminLoginPath } from '../../lib/adminRoutes'
import { useAdminAuth } from '../../context/useAdminAuth'
import type { InventoryItem } from '../../types/catalog'

const STATUS_LABELS: Record<InventoryItem['status'], string> = {
  untracked: 'לא מנוהל',
  out: 'אזל מהמלאי',
  low: 'מלאי נמוך',
  available: 'במלאי',
  preorder: 'Pre-order',
}

export default function AdminInventory() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InventoryItem['status']>('all')
  const [receipts, setReceipts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<InventoryItem[]>('/admin/inventory')
      .then(setItems)
      .catch((loadError) => {
        if (loadError instanceof ApiError && loadError.status === 401) {
          logout()
          navigate(adminLoginPath())
          return
        }
        setError('טעינת המלאי נכשלה')
      })
      .finally(() => setLoading(false))
  }, [logout, navigate])

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('he')
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const identity = `${item.product_name} ${item.variant_label || ''} ${item.sku || ''}`.toLocaleLowerCase('he')
      return matchesStatus && (!normalized || identity.includes(normalized))
    })
  }, [items, query, statusFilter])

  const tracked = items.filter((item) => item.is_tracked)
  const lowCount = tracked.filter((item) => item.status === 'low').length
  const outCount = tracked.filter((item) => item.status === 'out').length

  const receiveStock = async (item: InventoryItem) => {
    if (!item.inventory_item_id) return
    const quantity = Number(receipts[item.inventory_item_id])
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('יש להזין כמות חיובית ושלמה')
      return
    }
    setSavingId(item.inventory_item_id)
    setError('')
    try {
      const updated = await api.post<InventoryItem>(
        `/admin/inventory/${item.inventory_item_id}/adjust`,
        { quantity_delta: quantity, note: 'כניסת סחורה למחסן' },
      )
      setItems((current) => current.map((value) => value.inventory_item_id === updated.inventory_item_id ? updated : value))
      setReceipts((current) => ({ ...current, [item.inventory_item_id!]: '' }))
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'עדכון המלאי נכשל')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-inventory">
      <div className="admin-inventory__heading">
        <div><h1>מלאי</h1><p>מעקב עדכני לפי מוצר ומק״ט</p></div>
      </div>

      <section className="admin-inventory__summary">
        <div><span>מק״טים מנוהלים</span><strong>{tracked.length}</strong></div>
        <div className="admin-inventory__summary--low"><span>מלאי נמוך</span><strong>{lowCount}</strong></div>
        <div className="admin-inventory__summary--out"><span>אזל מהמלאי</span><strong>{outCount}</strong></div>
        <div><span>יחידות זמינות</span><strong>{tracked.reduce((sum, item) => sum + Math.max(0, item.available_quantity), 0)}</strong></div>
      </section>

      <div className="admin-inventory__toolbar">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי מוצר או מק״ט…" aria-label="חיפוש במלאי" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">כל מצבי המלאי</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </div>

      {error && <p className="admin-inventory__error" role="alert">{error}</p>}
      {loading && <p className="admin-inventory__state">טוען מלאי…</p>}
      {!loading && visibleItems.length === 0 && <p className="admin-inventory__state">לא נמצאו פריטי מלאי.</p>}

      {!loading && visibleItems.length > 0 && <div className="admin-inventory__table">
        <div className="admin-inventory__row admin-inventory__row--head">
          <span>מוצר</span><span>מק״ט</span><span>במחסן</span><span>שמור</span><span>זמין</span><span>מצב</span><span>כניסת סחורה</span>
        </div>
        {visibleItems.map((item) => <div className="admin-inventory__row" key={`${item.item_type}-${item.variant_id || item.product_id}`}>
          <span className="admin-inventory__product"><strong>{item.product_name}</strong>{item.variant_label && <small>{item.variant_label}</small>}</span>
          <span className="admin-inventory__sku">{item.sku || '—'}</span>
          <strong>{item.is_tracked ? item.stock_quantity : '—'}</strong>
          <span>{item.is_tracked ? item.reserved_quantity : '—'}</span>
          <strong>{item.is_tracked ? item.available_quantity : '—'}</strong>
          <span><span className={`admin-inventory__badge admin-inventory__badge--${item.status}`}>{STATUS_LABELS[item.status]}</span></span>
          <span className="admin-inventory__receipt">
            {item.inventory_item_id && item.is_tracked ? <>
              <input type="number" min="1" step="1" value={receipts[item.inventory_item_id] || ''} onChange={(event) => setReceipts((current) => ({ ...current, [item.inventory_item_id!]: event.target.value }))} placeholder="כמות" />
              <button type="button" onClick={() => receiveStock(item)} disabled={savingId === item.inventory_item_id}>{savingId === item.inventory_item_id ? 'מעדכן…' : 'הוספה'}</button>
            </> : <Link to={`/admin/products/${item.product_id}`}>הגדרת מלאי</Link>}
          </span>
        </div>)}
      </div>}
    </div>
  )
}
