import { useState } from 'react'

import type { HomeContent } from '../../../types/content'

export default function GallerySection({ gallery }: { gallery: HomeContent['gallery'] }) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const toggle = (key: string) => setActiveHotspot((current) => current === key ? null : key)

  return (
    <section className="gallery">
      <div className="gallery__top">
        {gallery.top.map((item, index) => (
          <div key={`${item.hotspot.label}-${index}`} className="gallery__img-wrap">
            <div className="gallery__img-bg" style={{ backgroundImage: `url(${gallery.image_url})`, backgroundSize: '300% auto', backgroundPosition: item.bg_position }} />
            <button className="gallery__hotspot" style={{ top: item.hotspot.top, left: item.hotspot.left }} onClick={() => toggle(`top-${index}`)} aria-label={item.hotspot.label} />
            {activeHotspot === `top-${index}` && <div className="gallery__tooltip"><strong>{item.hotspot.label}</strong><span>{item.hotspot.detail}</span></div>}
          </div>
        ))}
      </div>
      <div className="gallery__bottom gallery__img-wrap">
        <div className="gallery__img-bg" style={{ backgroundImage: `url(${gallery.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center 78%' }} />
        <button className="gallery__hotspot" style={{ top: gallery.bottom_hotspot.top, left: gallery.bottom_hotspot.left }} onClick={() => toggle('bottom')} aria-label={gallery.bottom_hotspot.label} />
        {activeHotspot === 'bottom' && <div className="gallery__tooltip gallery__tooltip--left"><strong>{gallery.bottom_hotspot.label}</strong><span>{gallery.bottom_hotspot.detail}</span></div>}
      </div>
    </section>
  )
}
