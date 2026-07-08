import { Link } from 'react-router-dom'
import craem from '../../../assets/CRAEM 1.5.png'
import craem4 from '../../../assets/CRAEM4 1.5 .png'
import craem5 from '../../../assets/CRAEM5 1.5.png'

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
              <img src={p.image} alt={p.name} className="product-card__image" />
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
