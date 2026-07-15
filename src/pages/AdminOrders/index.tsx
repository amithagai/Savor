import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './AdminOrders.css'
import { ApiError, api } from '../../lib/api'
import { useAdminAuth } from '../../context/useAdminAuth'

type OrderStatus = 'CREATED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

type OrderItem = {
  id: string
  quantity: number
  unit_price_snapshot: number
  line_total: number
  product_snapshot: { product_id?: string }
}

type Order = {
  id: string
  status: OrderStatus
  shipping_address: {
    full_name?: string
    phone?: string
    street?: string
    city?: string
    zip_code?: string
    notes?: string
  }
  subtotal_snapshot: number
  total_snapshot: number
  items: OrderItem[]
  created_at: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'נוצרה',
  PAID: 'שולמה',
  PROCESSING: 'בטיפול',
  SHIPPED: 'נשלחה',
  DELIVERED: 'נמסרה',
  CANCELLED: 'בוטלה',
}

const STATUS_ORDER: OrderStatus[] = ['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function badgeClass(status: OrderStatus) {
  if (status === 'CANCELLED') return 'admin-orders__badge admin-orders__badge--cancelled'
  if (status === 'DELIVERED') return 'admin-orders__badge admin-orders__badge--delivered'
  return 'admin-orders__badge'
}

export default function AdminOrders() {
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await api.get<Order[]>('/admin/orders', token)
        if (!cancelled) setOrders(data)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/admin/login')
          return
        }
        setError('טעינת ההזמנות נכשלה')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, logout, navigate])

  const visibleOrders = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setStatusSaving(orderId)
    try {
      const updated = await api.patch<Order>(`/admin/orders/${orderId}/status`, { status }, token)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/admin/login')
        return
      }
      setError('עדכון הסטטוס נכשל')
    } finally {
      setStatusSaving(null)
    }
  }

  return (
    <div className="admin-orders">
      <h1 className="admin-orders__title">הזמנות</h1>

      <div className="admin-orders__filters">
        <button
          type="button"
          className={filter === 'ALL' ? 'admin-orders__filter admin-orders__filter--active' : 'admin-orders__filter'}
          onClick={() => setFilter('ALL')}
        >
          הכל
        </button>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            className={
              filter === status ? 'admin-orders__filter admin-orders__filter--active' : 'admin-orders__filter'
            }
            onClick={() => setFilter(status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading && <p className="admin-orders__state">טוען…</p>}
      {!loading && error && <p className="admin-orders__state">{error}</p>}
      {!loading && !error && visibleOrders.length === 0 && (
        <p className="admin-orders__state">אין הזמנות עדיין</p>
      )}

      {!loading && !error && visibleOrders.length > 0 && (
        <div className="admin-orders__list">
          {visibleOrders.map((order) => {
            const address = order.shipping_address || {}
            const isOpen = expandedId === order.id

            return (
              <div className="admin-orders__card" key={order.id}>
                <button
                  type="button"
                  className="admin-orders__row"
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                >
                  <span className="admin-orders__row-id">#{order.id.slice(0, 8)}</span>
                  <span className="admin-orders__row-name">{address.full_name || 'ללא שם'}</span>
                  <span className="admin-orders__row-date">
                    {new Date(order.created_at).toLocaleDateString('he-IL')}
                  </span>
                  <span className={badgeClass(order.status)}>{STATUS_LABELS[order.status]}</span>
                  <span className="admin-orders__row-total">
                    {order.total_snapshot.toLocaleString()} ₪
                  </span>
                </button>

                {isOpen && (
                  <div className="admin-orders__detail">
                    <div className="admin-orders__detail-section">
                      <h3>פרטי משלוח</h3>
                      <div className="admin-orders__address">
                        {address.full_name} · {address.phone}
                        <br />
                        {address.street}, {address.city} {address.zip_code}
                        {address.notes && (
                          <>
                            <br />
                            הערות: {address.notes}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="admin-orders__detail-section">
                      <h3>פריטים</h3>
                      <div className="admin-orders__items">
                        {order.items.map((item) => (
                          <div className="admin-orders__item" key={item.id}>
                            <span>כמות {item.quantity}</span>
                            <span>{item.line_total.toLocaleString()} ₪</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="admin-orders__detail-section">
                      <h3>עדכון סטטוס</h3>
                      <div className="admin-orders__status-control">
                        <select
                          value={order.status}
                          disabled={statusSaving === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        >
                          {STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        {statusSaving === order.id && (
                          <span className="admin-orders__status-saving">שומר…</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
