import { useState } from 'react'

type Hotspot = { top: string; left: string; label: string; detail: string }

const topImages: { color: string; hotspot: Hotspot }[] = [
  {
    color: '#c8c0b4',
    hotspot: { top: '30%', left: '25%', label: 'ארון עליון', detail: 'גימור לבן מט, 60×90 ס״מ' },
  },
  {
    color: '#d0c8bc',
    hotspot: { top: '40%', left: '50%', label: 'ארון תחתון', detail: 'גוף סנדוויץ, 60×85 ס״מ' },
  },
  {
    color: '#b8c0b0',
    hotspot: { top: '35%', left: '60%', label: 'חזית', detail: 'צבע בתנור, גימור עץ' },
  },
]

const bottomHotspot: Hotspot = {
  top: '55%',
  left: '78%',
  label: 'מגירה',
  detail: 'עיצוב של... בגודל... בצבע...',
}

export default function GallerySection() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)

  const toggle = (key: string) =>
    setActiveHotspot((prev) => (prev === key ? null : key))

  return (
    <section className="gallery">
      {/* Top row — 3 equal images */}
      <div className="gallery__top">
        {topImages.map((img, i) => (
          <div
            key={i}
            className="gallery__img-wrap"
            style={{ background: img.color }}
          >
            <button
              className="gallery__hotspot"
              style={{ top: img.hotspot.top, left: img.hotspot.left }}
              onClick={() => toggle(`top-${i}`)}
              aria-label={img.hotspot.label}
            />
            {activeHotspot === `top-${i}` && (
              <div className="gallery__tooltip">
                <strong>{img.hotspot.label}</strong>
                <span>{img.hotspot.detail}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom — single wide image */}
      <div
        className="gallery__bottom gallery__img-wrap"
        style={{ background: '#c4beb6' }}
      >
        <button
          className="gallery__hotspot"
          style={{ top: bottomHotspot.top, left: bottomHotspot.left }}
          onClick={() => toggle('bottom')}
          aria-label={bottomHotspot.label}
        />
        {activeHotspot === 'bottom' && (
          <div className="gallery__tooltip gallery__tooltip--left">
            <strong>{bottomHotspot.label}</strong>
            <span>{bottomHotspot.detail}</span>
          </div>
        )}
      </div>
    </section>
  )
}
