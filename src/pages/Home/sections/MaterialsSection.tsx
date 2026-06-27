const materials = [
  { label: 'צירים של החברה העולמית DTC', color: '#c8c0b8' },
  { label: 'ארונות מעץ סנדוויץ׳', color: '#d4c4a8' },
  { label: 'מנגנוני טריקה שקטה', color: '#b8bcc0' },
  { label: 'דלתות בגימור צבע בתנור', color: '#d0ccc8' },
  { label: 'ידיות אינטגרליות', color: '#c4c0bc' },
  { label: 'שיש בייצור כחול לבן', color: '#d8d4d0' },
]

export default function MaterialsSection() {
  return (
    <section className="materials">
      <h2 className="section-title">החומרים שלנו</h2>
      <div className="materials__grid">
        {materials.map((m, i) => (
          <>
            <div key={m.label} className="materials__item">
              {/* Replace placeholder with: <img src={m.image} alt={m.label} /> */}
              <div
                className="materials__img-placeholder"
                style={{ background: m.color }}
              />
              <p className="materials__label">{m.label}</p>
            </div>
            {/* Vertical divider after every 1st and 2nd item in each row of 3 */}
            {i % 3 !== 2 && <div key={`div-${i}`} className="materials__divider" />}
          </>
        ))}
      </div>
    </section>
  )
}
