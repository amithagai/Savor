import { useState } from 'react'

import './SizeGuide.css'
import { useContentPage } from '../../hooks/useContentPage'
import { useSiteContent } from '../../hooks/useSiteContent'
import { DEFAULT_SIZE_GUIDE_CONTENT, normalizeSizeGuideContent } from '../../lib/sizeGuide'
import type { SizeGuideContent } from '../../types/content'

export default function SizeGuide() {
  const { page, loading, error } = useContentPage('size-guide')
  const guide = useSiteContent<SizeGuideContent>('size-guide')

  if (loading && guide.loading) {
    return <main className="size-guide"><div className="size-guide__container">טוען…</div></main>
  }

  const savedGuide = !guide.error && guide.data && Array.isArray(guide.data.steps) ? normalizeSizeGuideContent(guide.data) : null
  const guideContent = savedGuide || DEFAULT_SIZE_GUIDE_CONTENT
  const legacyTitles = ['מדריך ללקיחת מידה', 'מדריך לקיחת מידה']
  const pageTitle = !page || error || legacyTitles.includes(page.title) ? 'מפת הדרכים לבדיקת מידות:' : page.title

  return (
    <main className="size-guide">
      <div className="size-guide__container">
        <div className="size-guide__content">
          <header className="size-guide__header">
            <h1 className="size-guide__title">{pageTitle}</h1>
            {guideContent.subtitle && <p className="size-guide__subtitle">{guideContent.subtitle}</p>}
            {guideContent.introduction && <p className="size-guide__introduction">{guideContent.introduction}</p>}
          </header>

          {guideContent.steps.length > 0 ? (
            <SizeGuideAccordion content={guideContent} />
          ) : (
            <p className="size-guide__empty">שלבי המדריך יתווספו כאן בקרוב.</p>
          )}

          {(guideContent.closing_title || guideContent.closing_body || guideContent.closing_question || guideContent.closing_note) && (
            <footer className="size-guide__closing">
              {guideContent.closing_title && <h2>{guideContent.closing_title}</h2>}
              {guideContent.closing_body && <p>{guideContent.closing_body}</p>}
              {guideContent.closing_question && <h3>{guideContent.closing_question}</h3>}
              {guideContent.closing_note && <p>{guideContent.closing_note}</p>}
            </footer>
          )}
        </div>
      </div>
    </main>
  )
}

function SizeGuideAccordion({ content }: { content: SizeGuideContent }) {
  const [openSteps, setOpenSteps] = useState(() => new Set(content.steps[0] ? [content.steps[0].id] : []))

  const toggleStep = (stepId: string) => {
    setOpenSteps((current) => {
      const next = new Set(current)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  return (
    <section className="size-guide__steps" aria-label="שלבי בדיקת המידות">
      {content.steps.map((step, index) => {
        const isOpen = openSteps.has(step.id)
        const panelId = `size-guide-step-${step.id}`
        return (
          <article className={`size-guide__step${isOpen ? ' is-open' : ''}`} key={step.id}>
            <h2 className="size-guide__step-heading">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleStep(step.id)}
              >
                <span><b>שלב {index + 1}:</b> {step.title}</span>
                <span className="size-guide__chevron" aria-hidden="true" />
              </button>
            </h2>
            <div className="size-guide__panel" id={panelId} hidden={!isOpen}>
              <div className="size-guide__panel-inner">
                {step.lead && <p className="size-guide__lead">{step.lead}</p>}
                {step.body.split(/\n+/).filter(Boolean).map((paragraph, paragraphIndex) => (
                  <p key={`${step.id}-paragraph-${paragraphIndex}`}>{formatParagraph(paragraph)}</p>
                ))}
                {step.note && <p className="size-guide__note">{step.note}</p>}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function formatParagraph(paragraph: string) {
  const separator = paragraph.indexOf(':')
  if (separator <= 0 || separator > 32) return paragraph
  return <><strong>{paragraph.slice(0, separator + 1)}</strong>{paragraph.slice(separator + 1)}</>
}
