const items = [
  'אספקה תוך 14 ימי עסקים',
  'הנחות מיוחדות לרוכשים חוזרים',
  'התאמה אישית מלאה',
  'משלוח והרכבה עד הבית',
]

export default function AnnouncementBar() {
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
