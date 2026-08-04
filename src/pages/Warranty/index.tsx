import './Warranty.css'
import { useContentPage } from '../../hooks/useContentPage'

export default function Warranty() {
  const { page, loading, error } = useContentPage('warranty')
  if (loading) return <div className="warranty"><div className="warranty__container">טוען…</div></div>
  if (error || !page) return <div className="warranty"><div className="warranty__container">לא הצלחנו לטעון את העמוד.</div></div>

  const paragraphs = page.body.split(/\n\s*\n/)
  return <div className="warranty"><div className="warranty__container">
    <h1 className="warranty__title">{page.title}</h1>
    {paragraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 20)}-${index}`} className={`warranty__paragraph${index === paragraphs.length - 1 ? ' warranty__paragraph--closing' : ''}`}>{paragraph}</p>)}
  </div></div>
}
