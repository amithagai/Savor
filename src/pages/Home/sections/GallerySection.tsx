import { useState } from 'react'

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

  return (
    <section className="gallery">
      <div className="gallery__top">
        {gallery.top.map((item, index) => (
          <div key={`${item.hotspot.label}-${index}`} className="gallery__img-wrap">
            <img className="gallery__slice-image" src={gallery.image_url} alt="" aria-hidden="true" />
            {index < topHotspots.length && (
              <>
                <button
                  className="gallery__hotspot"
                  style={HOTSPOT_LAYOUT.top[index]}
                  onClick={() => toggle(`top-${index}`)}
                  aria-label={item.hotspot.label}
                  aria-expanded={activeHotspot === `top-${index}`}
                />
                {activeHotspot === `top-${index}` && (
                  <div className="gallery__tooltip" style={HOTSPOT_LAYOUT.top[index]} role="status">
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
              className="gallery__hotspot"
              style={HOTSPOT_LAYOUT.bottomFeature}
              onClick={() => toggle('bottom-feature')}
              aria-label={bottomFeature.hotspot.label}
              aria-expanded={activeHotspot === 'bottom-feature'}
            />
            {activeHotspot === 'bottom-feature' && (
              <div className="gallery__tooltip" style={HOTSPOT_LAYOUT.bottomFeature} role="status">
                <strong>{bottomFeature.hotspot.label}</strong>
                <span>{bottomFeature.hotspot.detail}</span>
              </div>
            )}
          </>
        )}
        <button
          className="gallery__hotspot"
          style={HOTSPOT_LAYOUT.bottom}
          onClick={() => toggle('bottom')}
          aria-label={gallery.bottom_hotspot.label}
          aria-expanded={activeHotspot === 'bottom'}
        />
        {activeHotspot === 'bottom' && (
          <div className="gallery__tooltip" style={HOTSPOT_LAYOUT.bottom} role="status">
            <strong>{gallery.bottom_hotspot.label}</strong>
            <span>{gallery.bottom_hotspot.detail}</span>
          </div>
        )}
      </div>
    </section>
  )
}
