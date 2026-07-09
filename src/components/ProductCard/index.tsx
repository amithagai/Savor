import './ProductCard.css'

type ProductCardProps = {
  name: string
  subtitle: string
  image?: string
  onAddToCart: () => void
}

export default function ProductCard({ name, subtitle, image, onAddToCart }: ProductCardProps) {
  return (
    <article className="savor-product-card">
      {image ? (
        <img src={image} alt={name} className="savor-product-card__image" loading="lazy" />
      ) : (
        <div className="savor-product-card__placeholder">{name}</div>
      )}

      <div className="savor-product-card__content">
        <h3>{name}</h3>
        <p>{subtitle}</p>
        <button className="savor-product-card__button" onClick={onAddToCart}>
          הוסף לסל
        </button>
      </div>
    </article>
  )
}