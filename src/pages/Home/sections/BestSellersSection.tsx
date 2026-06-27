import { Link } from 'react-router-dom'

const products = [
  { id: '1', name: 'מטבח', size: '1.5m', badge: 'קל לבנייה' },
  { id: '2', name: 'מטבח', size: '1.5m', badge: 'להיט' },
  { id: '3', name: 'מטבח', size: '1.5m', badge: 'פופולרי' },
]

export default function BestSellersSection() {
  return (
    <section className="best-sellers">
      <h2 className="section-title">הנמכרים ביותר</h2>
      <div className="best-sellers__grid">
        {products.map((p) => (
          <Link to={`/catalog/${p.id}`} key={p.id} className="product-card">
            <div className="product-card__image-wrap">
              {/* Replace with: <img src={p.image} alt={p.name} /> */}
              <div className="product-card__image-placeholder" />
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
