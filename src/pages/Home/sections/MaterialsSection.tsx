import React from "react"
import {
  materialHinges as hingesImg,
  materialPlywood as plywoodImg,
  materialSoftClose as softCloseImg,
  materialPaintDoors as paintDoorsImg,
  materialHandles as handlesImg,
  materialMarble as marbleImg,
} from '../../../assets/cloudinaryImages'
import "../Home.css"

const materials = [
  { label: 'צירים של החברה העולמית DTC', image: hingesImg },
  { label: 'ארונות מעץ סנדוויץ׳', image: plywoodImg },
  { label: 'מנגנוני טריקה שקטה', image: softCloseImg },
  { label: 'דלתות בגימור צבע בתנור', image: paintDoorsImg },
  { label: 'ידיות אינטגרליות', image: handlesImg },
  { label: 'שיש בייצור כחול לבן', image: marbleImg },
]

export default function MaterialsSection() {
  return (
    <section className="materials">
      <h2 className="section-title">החומרים שלנו</h2>
      <div className="materials__grid">
        {materials.map((m, i) => (
          <React.Fragment key={m.label + i}>
            <div className={`materials__item${i % 2 === 1 ? ' materials__item--reverse' : ''}`}>
              <img className="materials__img" src={m.image} alt={m.label} loading="lazy" />
              <p className="materials__label">{m.label}</p>
            </div>
            {/* Vertical divider after every 1st and 2nd item in each row of 3 */}
            {i % 3 !== 2 && <div key={`div-${i}`} className="materials__divider" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
