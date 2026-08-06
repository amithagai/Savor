import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import './ProductDetail.css'
import { useCart } from '../../context/useCart'
import { api } from '../../lib/api'
import type { CatalogProduct } from '../../types/catalog'

const ATTRIBUTE_LABELS: Record<string, string> = {
  size: 'מידה', model: 'דגם', color: 'צבע', material: 'חומר / גימור',
  delivery_days: 'זמן אספקה', sku: 'מק״ט',
}

export default function ProductDetail() {
  const { productId } = useParams()
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    if (!productId) return
    api.get<CatalogProduct>(`/catalog/products/${productId}`)
      .then(setProduct)
      .catch(() => setError('המוצר לא נמצא או שאינו זמין כרגע.'))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return <main className="product-detail"><p className="product-detail__state">טוען מוצר…</p></main>
  if (error || !product) return <main className="product-detail"><p className="product-detail__state">{error}</p></main>

  const isAccessory = product.product_type === 'ACCESSORY'
  const specs = Object.entries(product.attributes).filter(([, value]) => value !== '' && value != null)
  const addProduct = () => {
    if (product.current_price == null) return
    addToCart({
      id: product.id, name: product.name, size: String(product.attributes.size || ''),
      category: product.category?.name, price: product.current_price, image: product.images[0], quantity: 1,
    })
  }

  return (
    <main className="product-detail">
      <Link className="product-detail__back" to={isAccessory ? '/accessories' : '/catalog'}>→ חזרה לקטלוג</Link>
      <div className="product-detail__hero">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image">
            {product.images[selectedImage] ? <img src={product.images[selectedImage]} alt={product.name} /> : <span>{product.name}</span>}
          </div>
          {product.images.length > 1 && <div className="product-detail__thumbs">
            {product.images.map((image, index) => <button type="button" key={image} className={index === selectedImage ? 'product-detail__thumb product-detail__thumb--active' : 'product-detail__thumb'} onClick={() => setSelectedImage(index)}><img src={image} alt={`תמונה ${index + 1} של ${product.name}`} /></button>)}
          </div>}
        </div>

        <section className="product-detail__summary">
          {product.category && <span className="product-detail__category">{product.category.name}</span>}
          <h1>{product.name}</h1>
          {product.description && <p className="product-detail__description">{product.description}</p>}
          {product.current_price != null && <div className="product-detail__prices">
            <strong className="product-detail__price">{product.current_price.toLocaleString('he-IL')} ₪</strong>
            {product.original_price != null && <del className="product-detail__original-price">{product.original_price.toLocaleString('he-IL')} ₪</del>}
          </div>}
          {product.attributes.delivery_days != null && <p className="product-detail__delivery">אספקה משוערת: עד {String(product.attributes.delivery_days)} ימי עסקים</p>}
          <button className="product-detail__add" type="button" onClick={addProduct} disabled={product.current_price == null}>הוספה לסל</button>
          {product.installation_pdf_url && <a className="product-detail__pdf" href={product.installation_pdf_url} target="_blank" rel="noreferrer">הורדת הוראות התקנה</a>}
        </section>
      </div>

      {specs.length > 0 && <section className="product-detail__specs">
        <h2>מפרט המוצר</h2>
        <dl>{specs.map(([key, value]) => <div key={key}><dt>{ATTRIBUTE_LABELS[key] || key}</dt><dd>{key === 'delivery_days' ? `${String(value)} ימים` : String(value)}</dd></div>)}</dl>
      </section>}
    </main>
  )
}
