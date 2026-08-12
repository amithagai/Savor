import { useEffect, useState } from 'react'

import ProductCard from '../../components/ProductCard'
import '../Catalog/Catalog.css'
import { useCart } from '../../context/useCart'
import { api } from '../../lib/api'
import { getImageDisplaySettings } from '../../lib/imageDisplay'
import type { CatalogProduct } from '../../types/catalog'

export default function SingleProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    api.get<CatalogProduct[]>('/catalog/cabinets')
      .then(setProducts)
      .catch(() => setError('לא הצלחנו לטעון את המוצרים הבודדים. נסו שוב בעוד רגע.'))
      .finally(() => setLoading(false))
  }, [])

  const addProduct = (product: CatalogProduct) => {
    if (product.current_price == null || (!product.in_stock && !product.allow_preorder)) return
    addToCart({
      id: product.id,
      name: product.name,
      size: String(product.attributes.size || ''),
      category: product.category?.name,
      price: product.current_price,
      image: product.images[0],
      quantity: 1,
    })
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מוצרים בודדים</h1>
      </section>

      {loading && <p className="catalog-page__empty">טוען יחידות ארון…</p>}
      {!loading && error && <p className="catalog-page__empty">{error}</p>}
      {!loading && !error && <section className="catalog-page__grid">
        {products.length > 0 ? products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            subtitle={String(product.attributes.size || product.category?.name || 'יחידת ארון')}
            image={product.images[0]}
            imageDisplay={getImageDisplaySettings(product.attributes, product.images[0], { fit: 'cover', positionX: 50, positionY: 50 })}
            price={product.current_price}
            originalPrice={product.original_price}
            inStock={product.in_stock}
            allowPreorder={product.allow_preorder}
            productHref={`/single-products/${product.slug}`}
            onAddToCart={() => addProduct(product)}
          />
        )) : <p className="catalog-page__empty">עדיין אין יחידות ארון זמינות.</p>}
      </section>}
    </main>
  )
}
