import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import giff from '../../assets/pot.gif'
import { useCart } from '../../context/useCart'
import { api } from '../../lib/api'
import styles from '../Checkout/styles.module.css'

type OrderStatus = 'CREATED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
type Order = { id: string; order_number: number; status: OrderStatus }

const MAX_STATUS_CHECKS = 15

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { clearCart } = useCart()
  const [state, setState] = useState<'checking' | 'paid' | 'error'>('checking')
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    async function checkOrder(attempt: number) {
      if (!orderId) {
        setState('error')
        return
      }
      try {
        const order = await api.get<Order>(`/orders/${orderId}`)
        if (cancelled) return
        setOrderNumber(order.order_number)
        if (order.status === 'PAID' || ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
          clearCart()
          setState('paid')
          return
        }
        if (order.status === 'CANCELLED' || attempt >= MAX_STATUS_CHECKS) {
          setState('error')
          return
        }
        timeoutId = window.setTimeout(() => checkOrder(attempt + 1), 2000)
      } catch {
        if (!cancelled) setState('error')
      }
    }

    checkOrder(1)
    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [orderId, clearCart])

  return (
    <main className={styles.wrapper}>
      <img src={giff} className={styles.giff} alt="" />
      {state === 'checking' && (
        <>
          <h1>מאמתים את התשלום…</h1>
          <p>העמוד יתעדכן מיד כשנקבל אישור מאובטח מ־HYP.</p>
        </>
      )}
      {state === 'paid' && (
        <>
          <h1>תודה שרכשתם ב־SAVOR!</h1>
          <p>התשלום אושר וההזמנה נקלטה. הקבלה תישלח אליכם בדקות הקרובות.</p>
          <p className={styles.reference}>מספר הזמנה: {orderNumber}</p>
          <Link className={styles.link} to="/">חזרה לעמוד הבית</Link>
        </>
      )}
      {state === 'error' && (
        <>
          <h1>עדיין לא התקבל אישור תשלום</h1>
          <p>העגלה נשמרה. אם חויבתם, אל תנסו לשלם שוב ופנו אלינו עם מספר ההזמנה.</p>
          {orderNumber && <p className={styles.reference}>מספר הזמנה: {orderNumber}</p>}
          <Link className={styles.link} to="/cart">חזרה לעגלה</Link>
        </>
      )}
    </main>
  )
}
