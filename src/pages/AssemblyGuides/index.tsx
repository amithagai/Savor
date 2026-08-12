import { useEffect, useMemo, useState } from 'react'

import './AssemblyGuides.css'
import { api } from '../../lib/api'
import type { CatalogProduct, ProductType } from '../../types/catalog'

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  KITCHEN: 'מטבח',
  ACCESSORY: 'מוצר משלים',
  COMPONENT: 'רכיב',
}

export default function AssemblyGuides() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([
      api.get<CatalogProduct[]>('/catalog/kitchens?limit=100'),
      api.get<CatalogProduct[]>('/catalog/accessories?limit=100'),
    ])
      .then((results) => {
        if (results.every((result) => result.status === 'rejected')) {
          throw new Error('Catalog unavailable')
        }
        setProducts(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
      })
      .catch(() => setError('לא הצלחנו לטעון את חוברות ההרכבה. נסו שוב בעוד רגע.'))
      .finally(() => setLoading(false))
  }, [])

  const guides = useMemo(() => {
    const uniqueProducts = new Map(products.map((product) => [product.id, product]))
    return Array.from(uniqueProducts.values()).filter((product) => product.installation_pdf_url)
  }, [products])

  return (
    <main className="assembly-guides">
      <header className="assembly-guides__header">
        <span>תוכן והדרכה</span>
        <h1>חוברות הרכבה</h1>
        <p>הוראות התקנה והרכבה למוצרי Savor, זמינות לצפייה ולהורדה.</p>
      </header>

      {loading && <p className="assembly-guides__state">טוען חוברות…</p>}
      {!loading && error && <p className="assembly-guides__state assembly-guides__state--error">{error}</p>}
      {!loading && !error && guides.length === 0 && (
        <p className="assembly-guides__state">חוברות ההרכבה יתווספו כאן בקרוב.</p>
      )}

      {!loading && !error && guides.length > 0 && (
        <section className="assembly-guides__grid" aria-label="חוברות הרכבה זמינות">
          {guides.map((product) => (
            <article className="assembly-guide" key={product.id}>
              <div className="assembly-guide__image">
                {product.images[0]
                  ? <img src={product.images[0]} alt={product.name} />
                  : <span>ללא תמונה</span>}
              </div>
              <div className="assembly-guide__content">
                <span>{PRODUCT_TYPE_LABELS[product.product_type]}</span>
                <h2>{product.name}</h2>
                <a href={product.installation_pdf_url!} target="_blank" rel="noopener noreferrer">
                  צפייה בחוברת PDF
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
