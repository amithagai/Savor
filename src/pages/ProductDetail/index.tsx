import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import './ProductDetail.css'
import HeartIcon from '../../components/HeartIcon'
import { useCart } from '../../context/useCart'
import { useWishlist } from '../../context/useWishlist'
import { api } from '../../lib/api'
import { getImageDisplaySettings } from '../../lib/imageDisplay'
import type { CatalogProduct } from '../../types/catalog'

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 18v3h14v-3" />
    </svg>
  )
}

export default function ProductDetail() {
  const { productId } = useParams()
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const relatedTrackRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  useEffect(() => {
    if (!productId) return

    api.get<CatalogProduct>(`/catalog/products/${productId}`)
      .then((loadedProduct) => {
        setError('')
        setProduct(loadedProduct)
        setSelectedImage(0)
        setQuantity(1)

        return api.get<CatalogProduct[]>('/catalog/accessories')
          .then((products) => setRelatedProducts(products.filter((item) => item.id !== loadedProduct.id)))
          .catch(() => setRelatedProducts([]))
      })
      .catch(() => setError('המוצר לא נמצא או שאינו זמין כרגע.'))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return <main className="product-detail"><p className="product-detail__state">טוען מוצר…</p></main>
  if (error || !product) return <main className="product-detail"><p className="product-detail__state">{error}</p></main>

  const catalogPath = product.product_type === 'ACCESSORY'
    ? '/accessories'
    : product.product_type === 'CABINET'
      ? '/single-products'
      : '/catalog'
  const activeImage = product.images[selectedImage]
  const activeImageDisplay = getImageDisplaySettings(product.attributes, activeImage)
  const wishlistActive = isInWishlist(product.id)
  const canAddToCart = product.current_price != null && (product.in_stock || product.allow_preorder)

  const addProduct = () => {
    if (!canAddToCart || product.current_price == null) return
    addToCart({
      id: product.id,
      name: product.name,
      size: String(product.attributes.size || ''),
      category: product.category?.name,
      price: product.current_price,
      image: product.images[0],
      quantity,
    })
  }

  const toggleProductWishlist = () => {
    if (product.current_price == null) return
    toggleWishlist({
      id: product.id,
      name: product.name,
      subtitle: String(product.attributes.size || product.category?.name || ''),
      price: product.current_price,
      image: product.images[0],
    })
  }

  const scrollRelated = (direction: -1 | 1) => {
    relatedTrackRef.current?.scrollBy({
      left: direction * Math.max(220, relatedTrackRef.current.clientWidth * 0.55),
      behavior: 'smooth',
    })
  }

  return (
    <main className="product-detail">
      <div className="product-detail__hero">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image">
            {activeImage
              ? <>
                  <img className="product-detail__main-image-backdrop" src={activeImage} alt="" aria-hidden="true" style={{ objectPosition: `${activeImageDisplay.positionX}% ${activeImageDisplay.positionY}%` }} />
                  <img className="product-detail__main-image-photo" src={activeImage} alt={product.name} style={{ objectPosition: `${activeImageDisplay.positionX}% ${activeImageDisplay.positionY}%` }} />
                </>
              : <span>{product.name}</span>}
            {product.current_price != null && <button type="button" className={wishlistActive ? 'product-detail__wishlist product-detail__wishlist--active' : 'product-detail__wishlist'} aria-label={wishlistActive ? 'הסרה מהמועדפים' : 'הוספה למועדפים'} aria-pressed={wishlistActive} onClick={toggleProductWishlist}><HeartIcon filled={wishlistActive} /></button>}
          </div>

          {product.images.length > 1 && <div className="product-detail__thumbs" aria-label="תמונות נוספות">
            {product.images.map((image, index) => {
              const display = getImageDisplaySettings(product.attributes, image)
              return <button type="button" key={`${image}-${index}`} className={index === selectedImage ? 'product-detail__thumb product-detail__thumb--active' : 'product-detail__thumb'} aria-label={`הצגת תמונה ${index + 1} של ${product.name}`} aria-pressed={index === selectedImage} onClick={() => setSelectedImage(index)}><img src={image} alt="" style={{ objectFit: 'contain', objectPosition: `${display.positionX}% ${display.positionY}%` }} /></button>
            })}
          </div>}
        </div>

        <section className="product-detail__summary">
          <Link className="product-detail__back" to={catalogPath} aria-label="חזרה לקטלוג"><ChevronRightIcon /></Link>
          <h1>{product.name}</h1>

          {product.current_price != null && <div className="product-detail__prices">
            <strong className="product-detail__price">{product.current_price.toLocaleString('he-IL')} ₪</strong>
            {product.original_price != null && <del className="product-detail__original-price">{product.original_price.toLocaleString('he-IL')} ₪</del>}
          </div>}

          {product.description && <p className="product-detail__description">{product.description}</p>}

          {!product.in_stock && <p className={product.allow_preorder ? 'product-detail__stock product-detail__stock--preorder' : 'product-detail__stock'}>
            {product.allow_preorder ? 'אזל מהמלאי — זמין להזמנה מוקדמת' : 'אזל מהמלאי'}
          </p>}

          <div className="product-detail__purchase">
            <div className="product-detail__quantity" aria-label="כמות">
              <button type="button" aria-label="הפחתת כמות" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="הוספת כמות" onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <button className="product-detail__add" type="button" onClick={addProduct} disabled={!canAddToCart}>
              <BagIcon />
              <span>{!product.in_stock && !product.allow_preorder ? 'אזל מהמלאי' : product.allow_preorder && !product.in_stock ? 'הזמנה מוקדמת' : 'הוסף לסל'}</span>
            </button>
          </div>

          <div className="product-detail__meta">
            {product.attributes.delivery_days != null && <p className="product-detail__delivery">זמן אספקה עד {String(product.attributes.delivery_days)} ימי עסקים</p>}
            {product.installation_pdf_url && <a className="product-detail__pdf" href={product.installation_pdf_url} target="_blank" rel="noreferrer"><span>הורדת הוראות התקנה</span><DownloadIcon /></a>}
          </div>
        </section>
      </div>

      {relatedProducts.length > 0 && <section className="product-detail__related" aria-labelledby="related-products-title">
        <div className="product-detail__related-heading">
          <h2 id="related-products-title">מוצרים משלימים</h2>
          <div className="product-detail__related-controls" aria-label="ניווט בין מוצרים משלימים">
            <button type="button" aria-label="המוצרים הקודמים" onClick={() => scrollRelated(-1)}><ChevronRightIcon /></button>
            <button type="button" aria-label="המוצרים הבאים" onClick={() => scrollRelated(1)}><ChevronRightIcon /></button>
          </div>
        </div>

        <div className="product-detail__related-track" ref={relatedTrackRef}>
          {relatedProducts.map((relatedProduct) => {
            const relatedImage = relatedProduct.images[0]
            const relatedDisplay = getImageDisplaySettings(relatedProduct.attributes, relatedImage)
            const relatedProductPath = relatedProduct.product_type === 'ACCESSORY'
              ? '/accessories'
              : relatedProduct.product_type === 'CABINET'
                ? '/single-products'
                : '/catalog'
            return (
              <Link key={relatedProduct.id} className="product-detail__related-card" to={`${relatedProductPath}/${relatedProduct.slug}`}>
                <div className="product-detail__related-image">
                  {relatedImage
                    ? <img src={relatedImage} alt="" loading="lazy" style={{ objectFit: relatedDisplay.fit, objectPosition: `${relatedDisplay.positionX}% ${relatedDisplay.positionY}%` }} />
                    : <span>{relatedProduct.name}</span>}
                </div>
                <h3>{relatedProduct.name}</h3>
              </Link>
            )
          })}
        </div>
      </section>}
    </main>
  )
}
