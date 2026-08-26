import { useEffect, useMemo, useState } from 'react'

import ProductCard from '../../components/ProductCard'
import '../Catalog/Catalog.css'
import './Accessories.css'
import { useCart } from '../../context/useCart'
import { api } from '../../lib/api'
import { getImageDisplaySettings } from '../../lib/imageDisplay'
import type { CatalogProduct } from '../../types/catalog'

export default function Accessories() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState('הכל')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    api.get<CatalogProduct[]>('/catalog/accessories')
      .then(setProducts)
      .catch(() => setError('לא הצלחנו לטעון את המוצרים המשלימים.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category?.name).filter((name): name is string => !!name))), [products])
  const visibleProducts = selectedCategory === 'הכל' ? products : products.filter((product) => product.category?.name === selectedCategory)

  const addProduct = (product: CatalogProduct) => {
    if (product.current_price == null || (!product.in_stock && !product.allow_preorder)) return
    addToCart({ id: product.id, name: product.name, category: product.category?.name, price: product.current_price, image: product.images[0], productType: product.product_type, quantity: 1 })
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מוצרים משלימים</h1>
        {categories.length > 0 && <section className="accessories-page__filters" aria-label="סינון לפי קטגוריה">
          {['הכל', ...categories].map((category) => <button key={category} type="button" className={selectedCategory === category ? 'accessories-page__filter accessories-page__filter--active' : 'accessories-page__filter'} onClick={() => setSelectedCategory(category)}>{category}</button>)}
        </section>}
        <p className="accessories-page__subtitle">מוצרים משלימים שנבחרו להתאים למטבח שלכם</p>
      </section>

      {loading && <p className="catalog-page__empty">טוען מוצרים…</p>}
      {!loading && error && <p className="catalog-page__empty">{error}</p>}
      {!loading && !error && <section className="catalog-page__grid">
        {visibleProducts.length > 0 ? visibleProducts.map((product) => <ProductCard
          key={product.id}
          name={product.name}
          subtitle={product.category?.name || 'מוצר משלים'}
          image={product.images[0]}
          imageDisplay={getImageDisplaySettings(product.attributes, product.images[0], { fit: 'cover', positionX: 50, positionY: 50 })}
          price={product.current_price}
          originalPrice={product.original_price}
          inStock={product.in_stock}
          allowPreorder={product.allow_preorder}
          productHref={`/accessories/${product.slug}`}
          onAddToCart={() => addProduct(product)}
        />) : <p className="catalog-page__empty">עדיין אין מוצרים בקטגוריה הזאת.</p>}
      </section>}
    </main>
  )
}
