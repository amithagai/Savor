import './ProductCard.css'
import { Link } from 'react-router-dom'
import type { ImageDisplaySettings } from '../../types/catalog'

type ProductCardProps = {
  name: string
  subtitle: string
  image?: string
  imageDisplay?: ImageDisplaySettings
  price?: number | null
  originalPrice?: number | null
  inStock?: boolean
  allowPreorder?: boolean
  productHref?: string
  onAddToCart: () => void
}

export default function ProductCard({ name, subtitle, image, imageDisplay, price, originalPrice, inStock = true, allowPreorder = false, productHref, onAddToCart }: ProductCardProps) {
  const media = image ? (
    <img
      src={image}
      alt={name}
      className="savor-product-card__image"
      loading="lazy"
      style={imageDisplay ? { objectFit: imageDisplay.fit, objectPosition: `${imageDisplay.positionX}% ${imageDisplay.positionY}%` } : undefined}
    />
  ) : (
    <div className="savor-product-card__placeholder">{name}</div>
  )

  return (
    <article className="savor-product-card">
      {productHref ? <Link to={productHref}>{media}</Link> : media}

      <div className="savor-product-card__content">
        <h3>{productHref ? <Link to={productHref}>{name}</Link> : name}</h3>
        <p>{subtitle}</p>
        {price != null && <div className="savor-product-card__prices">
          <strong className="savor-product-card__price">{price.toLocaleString('he-IL')} ₪</strong>
          {originalPrice != null && <del className="savor-product-card__original-price">{originalPrice.toLocaleString('he-IL')} ₪</del>}
        </div>}
        {!inStock && <span className="savor-product-card__stock">אזל מהמלאי</span>}
        {allowPreorder && !inStock && <span className="savor-product-card__stock savor-product-card__stock--preorder">זמין להזמנה מוקדמת</span>}
        <button className="savor-product-card__button" onClick={onAddToCart} disabled={!inStock && !allowPreorder}>
          {!inStock && !allowPreorder ? 'אזל מהמלאי' : allowPreorder && !inStock ? 'הזמנה מוקדמת' : 'הוסף לסל'}
        </button>
      </div>
    </article>
  )
}
