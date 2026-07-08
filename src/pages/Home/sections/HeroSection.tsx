import { Link } from 'react-router-dom'
import heroBg from '../../../assets/לעמוד הבית.png'
import AnnouncementBar from './AnnouncementBar'

export default function HeroSection() {

  return (
    <section className="hero">
      <div className="hero__image" style={{ backgroundImage: `url(${heroBg})` }} />

      <div className="hero__overlay" />

      <AnnouncementBar />

      <div className="hero__content">
        <h1 className="hero__title">עיצוב אדריכלי במחיר הגיוני</h1>
        <p className="hero__subtitle">
          תכנון חכם, התאמה אישית מלאה ואספקה תוך 14 ימי עסקים!
        </p>
        <Link to="/configurator" className="hero__cta">
          כלי תכנון ←
        </Link>
      </div>
    </section>
  )
}
