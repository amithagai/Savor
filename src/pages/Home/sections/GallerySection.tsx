import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import type { HomeContent } from '../../../types/content'

const HOTSPOT_LAYOUT = {
  top: [
    { top: '40%', left: '75%' },
    { top: '73%', left: '26%' },
  ],
  bottomFeature: { top: '25%', left: '53%' },
  bottom: { top: '40%', left: '85%' },
}

export default function GallerySection({ gallery }: { gallery: HomeContent['gallery'] }) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const toggle = (key: string) => setActiveHotspot((current) => current === key ? null : key)

  const topHotspots = gallery.top.slice(0, 2)
  const bottomFeature = gallery.top[2]
  const closeOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') setActiveHotspot(null)
  }

  return (
    <section className="gallery" aria-labelledby="gallery-title" aria-describedby="gallery-description">
      <h2 id="gallery-title" className="visually-hidden">גלריית מטבחים</h2>
      <p id="gallery-description" className="visually-hidden">
        תמונת מטבח עם נקודות מידע שניתן לפתוח לקבלת פרטים נוספים.
      </p>
      <div className="gallery__top">
        {gallery.top.map((item, index) => (
          <div key={`${item.hotspot.label}-${index}`} className="gallery__img-wrap">
            <img className="gallery__slice-image" src={gallery.image_url} alt="" aria-hidden="true" />
            {index < topHotspots.length && (
              <>
                <button
                  type="button"
                  className="gallery__hotspot"
                  style={HOTSPOT_LAYOUT.top[index]}
                  onClick={() => toggle(`top-${index}`)}
                  onKeyDown={closeOnEscape}
                  aria-label={item.hotspot.label}
                  aria-expanded={activeHotspot === `top-${index}`}
                  aria-controls={`gallery-tooltip-top-${index}`}
                  aria-describedby={activeHotspot === `top-${index}` ? `gallery-tooltip-top-${index}` : undefined}
                />
                {activeHotspot === `top-${index}` && (
                  <div id={`gallery-tooltip-top-${index}`} className="gallery__tooltip" style={HOTSPOT_LAYOUT.top[index]} role="tooltip">
                    <strong>{item.hotspot.label}</strong>
                    <span>{item.hotspot.detail}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="gallery__bottom gallery__img-wrap">
        <img className="gallery__bottom-image" src={gallery.image_url} alt="" aria-hidden="true" />
        {bottomFeature && (
          <>
            <button
              type="button"
              className="gallery__hotspot"
              style={HOTSPOT_LAYOUT.bottomFeature}
              onClick={() => toggle('bottom-feature')}
              onKeyDown={closeOnEscape}
              aria-label={bottomFeature.hotspot.label}
              aria-expanded={activeHotspot === 'bottom-feature'}
              aria-controls="gallery-tooltip-bottom-feature"
              aria-describedby={activeHotspot === 'bottom-feature' ? 'gallery-tooltip-bottom-feature' : undefined}
            />
            {activeHotspot === 'bottom-feature' && (
              <div id="gallery-tooltip-bottom-feature" className="gallery__tooltip" style={HOTSPOT_LAYOUT.bottomFeature} role="tooltip">
                <strong>{bottomFeature.hotspot.label}</strong>
                <span>{bottomFeature.hotspot.detail}</span>
              </div>
            )}
          </>
        )}
        <button
          type="button"
          className="gallery__hotspot"
          style={HOTSPOT_LAYOUT.bottom}
          onClick={() => toggle('bottom')}
          onKeyDown={closeOnEscape}
          aria-label={gallery.bottom_hotspot.label}
          aria-expanded={activeHotspot === 'bottom'}
          aria-controls="gallery-tooltip-bottom"
          aria-describedby={activeHotspot === 'bottom' ? 'gallery-tooltip-bottom' : undefined}
        />
        {activeHotspot === 'bottom' && (
          <div id="gallery-tooltip-bottom" className="gallery__tooltip" style={HOTSPOT_LAYOUT.bottom} role="tooltip">
            <strong>{gallery.bottom_hotspot.label}</strong>
            <span>{gallery.bottom_hotspot.detail}</span>
          </div>
        )}
      </div>
    </section>
  )
}
