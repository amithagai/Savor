import './Home.css'
import HeroSection from './sections/HeroSection'
import BestSellersSection from './sections/BestSellersSection'
import MaterialsSection from './sections/MaterialsSection'
import GallerySection from './sections/GallerySection'
import TestimonialsSection from './sections/TestimonialsSection'
import NewsletterSection from './sections/NewsletterSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="home__content">
        <BestSellersSection />
        <MaterialsSection />
        <GallerySection />
        <TestimonialsSection />
        <NewsletterSection />
      </div>
    </>
  )
}
