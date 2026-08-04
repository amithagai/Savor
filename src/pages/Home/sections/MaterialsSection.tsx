import React from 'react'

type Props = {
  title: string
  materials: Array<{ label: string; image_url: string }>
}

export default function MaterialsSection({ title, materials }: Props) {
  return (
    <section className="materials">
      <h2 className="section-title">{title}</h2>
      <div className="materials__grid">
        {materials.map((material, index) => (
          <React.Fragment key={`${material.label}-${index}`}>
            <div className={`materials__item${index % 2 === 1 ? ' materials__item--reverse' : ''}`}>
              <img className="materials__img" src={material.image_url} alt={material.label} loading="lazy" />
              <p className="materials__label">{material.label}</p>
            </div>
            {index % 3 !== 2 && <div key={`divider-${index}`} className="materials__divider" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
