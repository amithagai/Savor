import { Link } from 'react-router-dom'
import './Home.css'
import HeroSection from './sections/HeroSection'
import BestSellersSection from './sections/BestSellersSection'
import MaterialsSection from './sections/MaterialsSection'
import GallerySection from './sections/GallerySection'
import TestimonialsSection from './sections/TestimonialsSection'
import NewsletterSection from './sections/NewsletterSection'
import { useSiteContent } from '../../hooks/useSiteContent'
import type { HomeContent } from '../../types/content'

export default function Home() {
  const { data, loading, error } = useSiteContent<HomeContent>('home')

  if (loading) return <main className="home__state">טוען את האתר…</main>
  if (error || !data) return <main className="home__state">לא הצלחנו לטעון את תוכן האתר.</main>

  return (
    <>
      <HeroSection hero={data.hero} announcements={data.announcements} />
      <div className="home__content">
        {/* Mobile-only quick links, hidden on desktop */}
        <div className="hero__tags">
          {data.hero.tags.map((tag) => (
            <Link key={tag.label} to={tag.to} className="hero__tag">
              {tag.label}
            </Link>
          ))}
        </div>
        <BestSellersSection config={data.best_sellers} />
        <MaterialsSection title={data.materials_title} materials={data.materials} />
        <GallerySection gallery={data.gallery} />
        <TestimonialsSection title={data.testimonials_title} testimonials={data.testimonials} />
        <NewsletterSection content={data.newsletter} />
      </div>
    </>
  )
}
