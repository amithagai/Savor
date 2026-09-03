import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './AdminPrices.css'
import { ApiError, api } from '../../lib/api'
import { adminLoginPath } from '../../lib/adminRoutes'
import { useAdminAuth } from '../../context/useAdminAuth'

type ProductType = 'KITCHEN' | 'CABINET' | 'ACCESSORY' | 'COMPONENT'

type AdminProduct = {
  id: string
  slug: string
  name: string
  product_type: ProductType
  is_active: boolean
  current_price: number | null
  regular_price: number | null
  original_price: number | null
}

const TYPE_LABELS: Record<ProductType, string> = {
  KITCHEN: 'מטבח',
  CABINET: 'מוצר בודד',
  ACCESSORY: 'אביזר',
  COMPONENT: 'רכיב',
}

export default function AdminPrices() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saleDrafts, setSaleDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api.get<AdminProduct[]>('/admin/products')
        if (cancelled) return
        setProducts(data)
        setDrafts(Object.fromEntries(data.map((p) => [p.id, String(p.regular_price ?? p.current_price ?? '')])))
        setSaleDrafts(Object.fromEntries(data.map((p) => [p.id, p.original_price != null ? String(p.current_price ?? '') : ''])))
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate(adminLoginPath())
          return
        }
        setError('טעינת המוצרים נכשלה')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [logout, navigate])

  const handleSave = async (productId: string) => {
    const amount = Number(drafts[productId])
    if (!Number.isFinite(amount) || amount <= 0) return
    const saleAmount = saleDrafts[productId]?.trim() ? Number(saleDrafts[productId]) : null
    if (saleAmount != null && (!Number.isFinite(saleAmount) || saleAmount <= 0 || saleAmount >= amount)) {
      setError('מחיר המבצע חייב להיות נמוך מהמחיר הרגיל')
      return
    }

    setSavingId(productId)
    setError('')
    try {
      const updated = await api.patch<AdminProduct>(
        `/admin/products/${productId}/price`,
        { amount, sale_amount: saleAmount },
      )
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))
      setSavedId(productId)
      setTimeout(() => setSavedId((current) => (current === productId ? null : current)), 1500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate(adminLoginPath())
        return
      }
      setError('שמירת המחיר נכשלה')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-prices">
      <h1 className="admin-prices__title">מחירים</h1>

      {loading && <p className="admin-prices__state">טוען…</p>}
      {!loading && error && <p className="admin-prices__state">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="admin-prices__state">אין מוצרים להצגה</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="admin-prices__table">
          <div className="admin-prices__row admin-prices__row--head">
            <span className="admin-prices__col-name">מוצר</span>
            <span className="admin-prices__col-type">סוג</span>
            <span className="admin-prices__col-price">מחיר רגיל</span>
            <span className="admin-prices__col-price">מחיר מבצע</span>
            <span className="admin-prices__col-action" />
          </div>

          {products.map((product) => (
            <div className="admin-prices__row" key={product.id}>
              <span className="admin-prices__col-name">
                {product.name}
                {!product.is_active && (
                  <span className="admin-prices__badge admin-prices__badge--inactive" style={{ marginRight: 8 }}>
                    לא פעיל
                  </span>
                )}
              </span>
              <span className="admin-prices__col-type">
                <span className="admin-prices__badge">{TYPE_LABELS[product.product_type]}</span>
              </span>
              <span className="admin-prices__col-price">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={drafts[product.id] ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))
                  }
                />
                <span className="admin-prices__currency">₪</span>
              </span>
              <span className="admin-prices__col-price">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={saleDrafts[product.id] ?? ''}
                  placeholder="ללא מבצע"
                  onChange={(e) =>
                    setSaleDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))
                  }
                />
                <span className="admin-prices__currency">₪</span>
              </span>
              <span className="admin-prices__col-action">
                <button
                  type="button"
                  className={
                    savedId === product.id
                      ? 'admin-prices__save admin-prices__save--saved'
                      : 'admin-prices__save'
                  }
                  disabled={savingId === product.id}
                  onClick={() => handleSave(product.id)}
                >
                  {savedId === product.id ? 'נשמר' : savingId === product.id ? 'שומר…' : 'שמירה'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
