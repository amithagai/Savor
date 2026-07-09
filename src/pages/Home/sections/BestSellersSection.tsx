import { Link } from 'react-router-dom'
import { craem1 as craem, craem4, craem5 } from '../../../assets/cloudinaryImages'

const products = [
  { id: '1', name: 'מטבח', size: '1.5m', badge: 'קל לבנייה', image: craem4 },
  { id: '2', name: 'מטבח', size: '1.5m', badge: 'להיט', image: craem },
  { id: '3', name: 'מטבח', size: '1.5m', badge: 'פופולרי', image: craem5 },
]

export default function BestSellersSection() {
  return (
    <section className="best-sellers">
      <h2 className="section-title">הנמכרים ביותר</h2>
      <div className="best-sellers__grid">
        {products.map((p) => (
          <Link to={`/catalog/${p.id}`} key={p.id} className="product-card">
            <div className="product-card__image-wrap">
              <img src={p.image} alt={p.name} className="product-card__image" loading="lazy" />
              <span className="product-card__badge">{p.badge}</span>
            </div>
            <div className="product-card__info">
              <span className="product-card__name">{p.name}</span>
              <span className="product-card__size">{p.size}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
