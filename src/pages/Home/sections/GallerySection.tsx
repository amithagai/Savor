import { useState } from 'react'
import { galleryPhoto } from '../../../assets/cloudinaryImages'

type Hotspot = { top: string; left: string; label: string; detail: string }

// One shared lifestyle photo, sliced across the tiles via background-position
// so the top row and bottom band read as facets of the same kitchen.
const topImages: { bgPosition: string; hotspot: Hotspot }[] = [
  {
    bgPosition: '5% 55%',
    hotspot: { top: '30%', left: '25%', label: 'ארון עליון', detail: 'גימור לבן מט, 60×90 ס״מ' },
  },
  {
    bgPosition: '48% 5%',
    hotspot: { top: '40%', left: '50%', label: 'ארון תחתון', detail: 'גוף סנדוויץ, 60×85 ס״מ' },
  },
  {
    bgPosition: '100% 40%',
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
            style={{ backgroundImage: `url(${galleryPhoto})`, backgroundSize: '300% auto', backgroundPosition: img.bgPosition }}
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
        style={{ backgroundImage: `url(${galleryPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center 78%' }}
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
