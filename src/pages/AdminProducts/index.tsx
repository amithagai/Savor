import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import './AdminProducts.css'
import { ApiError, api } from '../../lib/api'
import { useAdminAuth } from '../../context/useAdminAuth'
import type { AdminProduct, ProductType } from '../../types/catalog'

const TYPE_LABELS: Record<ProductType, string> = {
  KITCHEN: 'מטבח',
  CABINET: 'מוצר בודד',
  ACCESSORY: 'מוצר משלים',
  COMPONENT: 'רכיב לקונפיגורטור',
}

export default function AdminProducts() {
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ProductType | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<AdminProduct[]>('/admin/products', token)
      .then(setProducts)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/admin/login')
          return
        }
        setError('טעינת המוצרים נכשלה')
      })
      .finally(() => setLoading(false))
  }, [token, logout, navigate])

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('he')
    return products.filter((product) => {
      const matchesType = type === 'ALL' || product.product_type === type
      const matchesQuery = !normalized
        || product.name.toLocaleLowerCase('he').includes(normalized)
        || product.slug.toLowerCase().includes(normalized)
      return matchesType && matchesQuery
    })
  }, [products, query, type])

  return (
    <div className="admin-products">
      <div className="admin-products__heading">
        <div>
          <h1>מוצרים</h1>
          <p>{products.length} מוצרים במערכת</p>
        </div>
        <Link className="admin-products__add" to="/admin/products/new">+ מוצר חדש</Link>
      </div>

      <div className="admin-products__toolbar">
        <input
          type="search"
          placeholder="חיפוש לפי שם או כתובת…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="חיפוש מוצרים"
        />
        <select value={type} onChange={(event) => setType(event.target.value as ProductType | 'ALL')}>
          <option value="ALL">כל סוגי המוצרים</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading && <p className="admin-products__state">טוען מוצרים…</p>}
      {!loading && error && <p className="admin-products__state admin-products__state--error">{error}</p>}
      {!loading && !error && visibleProducts.length === 0 && <p className="admin-products__state">לא נמצאו מוצרים.</p>}

      {!loading && !error && visibleProducts.length > 0 && (
        <div className="admin-products__list">
          {visibleProducts.map((product) => (
            <Link className="admin-products__row" to={`/admin/products/${product.id}`} key={product.id}>
              <div className="admin-products__thumb">
                {product.primary_image ? <img src={product.primary_image} alt="" /> : <span>אין תמונה</span>}
              </div>
              <div className="admin-products__identity">
                <strong>{product.name}</strong>
                <small>{product.category_name || TYPE_LABELS[product.product_type]}</small>
              </div>
              <span className={`admin-products__status ${product.is_active ? 'admin-products__status--active' : ''}`}>
                {product.is_active ? 'מפורסם' : 'טיוטה'}
              </span>
              <span className="admin-products__price">
                {product.current_price ? <>
                  <strong>{product.current_price.toLocaleString('he-IL')} ₪</strong>
                  {product.original_price != null && <del>{product.original_price.toLocaleString('he-IL')} ₪</del>}
                </> : 'ללא מחיר'}
              </span>
              <span className="admin-products__edit">עריכה ←</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
