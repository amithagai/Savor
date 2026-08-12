import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ProductCard from '../../components/ProductCard'
import './Catalog.css'
import { useCart } from '../../context/useCart'
import { api } from '../../lib/api'
import { getImageDisplaySettings } from '../../lib/imageDisplay'
import type { CatalogProduct } from '../../types/catalog'
import { knownColorHexOf } from '../Configurator/colors'

export default function Catalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const { addToCart } = useCart()

  useEffect(() => {
    api.get<CatalogProduct[]>('/catalog/kitchens')
      .then(setProducts)
      .catch(() => setError('לא הצלחנו לטעון את הקטלוג. נסו שוב בעוד רגע.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedSize = searchParams.get('size') || 'הכל'
  const visibleProducts = selectedSize === 'הכל'
    ? products
    : products.filter((product) => product.attributes.size === selectedSize)

  const addProduct = (product: CatalogProduct) => {
    if (product.current_price == null || (!product.in_stock && !product.allow_preorder)) return
    addToCart({
      id: product.id,
      name: product.name,
      size: String(product.attributes.size || ''),
      price: product.current_price,
      image: product.images[0],
      swatchColor: knownColorHexOf(String(product.attributes.model || ''), String(product.attributes.color || ''), product.name, product.slug),
      quantity: 1,
    })
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>{selectedSize === 'הכל' ? 'מטבחים' : `מטבח ${selectedSize}`}</h1>
      </section>

      {loading && <p className="catalog-page__empty">טוען מטבחים…</p>}
      {!loading && error && <p className="catalog-page__empty">{error}</p>}
      {!loading && !error && <section className="catalog-page__grid">
        {visibleProducts.length > 0 ? visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            subtitle={String(product.attributes.size || product.category?.name || 'מטבח')}
            image={product.images[0]}
            imageDisplay={getImageDisplaySettings(product.attributes, product.images[0], { fit: 'cover', positionX: 50, positionY: 50 })}
            price={product.current_price}
            originalPrice={product.original_price}
            inStock={product.in_stock}
            allowPreorder={product.allow_preorder}
            productHref={`/catalog/${product.slug}`}
            onAddToCart={() => addProduct(product)}
          />
        )) : <p className="catalog-page__empty">עדיין אין מטבחים זמינים{selectedSize !== 'הכל' ? ` במידה ${selectedSize}` : ''}.</p>}
      </section>}
    </main>
  )
}
