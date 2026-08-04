import '../Warranty/Warranty.css'
import { useContentPage } from '../../hooks/useContentPage'

export default function SizeGuide() {
  const { page, loading, error } = useContentPage('size-guide')
  if (loading) return <div className="warranty"><div className="warranty__container">טוען…</div></div>
  if (error || !page) return <div className="warranty"><div className="warranty__container">לא הצלחנו לטעון את העמוד.</div></div>
  return <div className="warranty"><div className="warranty__container"><h1 className="warranty__title">{page.title}</h1>{page.body.split(/\n\s*\n/).map((paragraph, index) => <p className="warranty__paragraph" key={`${paragraph}-${index}`}>{paragraph}</p>)}</div></div>
}
