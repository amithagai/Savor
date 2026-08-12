import '../Warranty/Warranty.css'
import { useContentPage } from '../../hooks/useContentPage'

export default function Terms() {
  const { page, loading, error } = useContentPage('terms')

  if (loading) {
    return <div className="warranty"><div className="warranty__container">טוען…</div></div>
  }

  if (error || !page) {
    return <div className="warranty"><div className="warranty__container">תנאי השימוש טרם פורסמו.</div></div>
  }

  const paragraphs = page.body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim())

  return (
    <div className="warranty">
      <div className="warranty__container">
        <h1 className="warranty__title">{page.title}</h1>
        {paragraphs.map((paragraph, index) => (
          <p className="warranty__paragraph" key={`${paragraph.slice(0, 30)}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
