import './ProductCard.css'
import { Link } from 'react-router-dom'

type ProductCardProps = {
  name: string
  subtitle: string
  image?: string
  price?: number | null
  productHref?: string
  onAddToCart: () => void
}

export default function ProductCard({ name, subtitle, image, price, productHref, onAddToCart }: ProductCardProps) {
  const media = image ? (
    <img src={image} alt={name} className="savor-product-card__image" loading="lazy" />
  ) : (
    <div className="savor-product-card__placeholder">{name}</div>
  )

  return (
    <article className="savor-product-card">
      {productHref ? <Link to={productHref}>{media}</Link> : media}

      <div className="savor-product-card__content">
        <h3>{productHref ? <Link to={productHref}>{name}</Link> : name}</h3>
        <p>{subtitle}</p>
        {price != null && <strong className="savor-product-card__price">{price.toLocaleString('he-IL')} ₪</strong>}
        <button className="savor-product-card__button" onClick={onAddToCart}>
          הוסף לסל
        </button>
      </div>
    </article>
  )
}
