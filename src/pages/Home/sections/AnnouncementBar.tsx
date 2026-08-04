export default function AnnouncementBar({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items]

  return (
    <div className="announcement-bar">
      <div className="announcement-bar__track">
        {repeated.map((item, i) => (
          <span key={i} className="announcement-bar__item">
            {item}
            <span className="announcement-bar__dot">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
