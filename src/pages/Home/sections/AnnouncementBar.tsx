export default function AnnouncementBar({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items]

  return (
    <section className="announcement-bar" aria-label="הודעות חשובות">
      <ul className="visually-hidden">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
      <div className="announcement-bar__track" aria-hidden="true">
        {repeated.map((item, i) => (
          <span key={i} className="announcement-bar__item">
            {item}
            <span className="announcement-bar__dot">•</span>
          </span>
        ))}
      </div>
    </section>
  )
}
