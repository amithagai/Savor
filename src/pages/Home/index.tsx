import { Link } from 'react-router-dom'
import './Home.css'
import HeroSection from './sections/HeroSection'
import BestSellersSection from './sections/BestSellersSection'
import MaterialsSection from './sections/MaterialsSection'
import GallerySection from './sections/GallerySection'
import TestimonialsSection from './sections/TestimonialsSection'
import NewsletterSection from './sections/NewsletterSection'

const heroTags = [
  { label: 'מטבחים', to: '/catalog' },
  { label: 'התאמה אישית', to: '/configurator' },
  { label: 'מוצרים משלמים', to: '/accessories' },
]

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="home__content">
        {/* Mobile-only quick links, hidden on desktop */}
        <div className="hero__tags">
          {heroTags.map((tag) => (
            <Link key={tag.label} to={tag.to} className="hero__tag">
              {tag.label}
            </Link>
          ))}
        </div>
        <BestSellersSection />
        <MaterialsSection />
        <GallerySection />
        <TestimonialsSection />
        <NewsletterSection />
      </div>
    </>
  )
}
