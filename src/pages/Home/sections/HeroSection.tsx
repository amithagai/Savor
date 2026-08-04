import { Link } from 'react-router-dom'

import AnnouncementBar from './AnnouncementBar'
import type { HomeContent } from '../../../types/content'

type Props = {
  hero: HomeContent['hero']
  announcements: string[]
}

export default function HeroSection({ hero, announcements }: Props) {
  return (
    <section className="hero">
      <div className="hero__image" style={{ backgroundImage: `url(${hero.image_url})` }} />
      <div className="hero__overlay" />
      <AnnouncementBar items={announcements} />
      <div className="hero__content">
        <h1 className="hero__title">{hero.title}</h1>
        <p className="hero__subtitle">{hero.subtitle}</p>
        <Link to={hero.cta_url} className="hero__cta">{hero.cta_label}</Link>
      </div>
    </section>
  )
}
