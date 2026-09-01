import './About.css'
import clientPhoto from '../../assets/תמונת לקוחה.png'
import { useContentPage } from '../../hooks/useContentPage'

export default function About() {
  const { page, loading, error } = useContentPage('about')

  if (loading) return <div className="about"><div className="about__container">טוען…</div></div>
  if (error || !page) return <div className="about"><div className="about__container">לא הצלחנו לטעון את העמוד.</div></div>

  const imageUrl = page.image_url?.trim() || clientPhoto

  return (
    <div className="about">
      <div className="about__container">
        <h1 className="about__title">{page.title}</h1>
        <div className="about__content">
          <div className="about__image"><img src={imageUrl} alt="אודות Savor" /></div>
          <div className="about__text">
            {page.body.split(/\n\s*\n/).map((paragraph, index, paragraphs) => (
              <p key={`${paragraph.slice(0, 20)}-${index}`} className={`about__paragraph${index === paragraphs.length - 1 ? ' about__paragraph--closing' : ''}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
