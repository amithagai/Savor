import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../../../lib/api'
import type { CatalogProduct } from '../../../types/catalog'
import type { HomeContent } from '../../../types/content'

export default function BestSellersSection({ config }: { config?: HomeContent['best_sellers'] }) {
  const [products, setProducts] = useState<CatalogProduct[]>([])

  useEffect(() => {
    api.get<CatalogProduct[]>('/catalog/kitchens')
      .then((items) => {
        if (config) {
          const byId = new Map(items.map((item) => [item.id, item]))
          setProducts(config.product_ids.map((id) => byId.get(id)).filter((item): item is CatalogProduct => !!item))
          return
        }
        const featured = items.filter((item) => item.attributes.featured)
        setProducts((featured.length ? featured : items).slice(0, 3))
      })
      .catch(() => setProducts([]))
  }, [config])

  if (!products.length) return null

  return (
    <section className="best-sellers">
      <h2 className="section-title">{config?.title || 'הנמכרים ביותר'}</h2>
      <div className="best-sellers__grid">
        {products.map((product) => (
          <Link to={`/catalog/${product.slug}`} key={product.id} className="product-card">
            <div className="product-card__image-wrap">
              {product.images[0] && <img src={product.images[0]} alt={product.name} className="product-card__image" loading="lazy" />}
              {typeof product.attributes.badge === 'string' && <span className="product-card__badge">{product.attributes.badge}</span>}
            </div>
            <div className="product-card__info">
              <span className="product-card__name">{product.name}</span>
              <span className="product-card__size">{String(product.attributes.size || '')}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
