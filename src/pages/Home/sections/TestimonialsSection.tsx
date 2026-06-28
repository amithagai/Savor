const testimonials = [
  {
    name: 'טיילור סוויפט',
    rating: 4.5,
    text: 'תגובה ממש טובה תגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובה ממש טובה.',
  },
  {
    name: 'טיילור סוויפט',
    rating: 4.5,
    text: 'תגובה ממש טובה תגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובה ממש טובה.',
  },
  {
    name: 'טיילור סוויפט',
    rating: 4.5,
    text: 'תגובה ממש טובה תגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובהתגובה ממש טובה ממש טובה ממש טובה.',
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="stars" aria-label={`דירוג ${rating} מתוך 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i + 1 <= Math.floor(rating) ? 1 : i < rating ? 0.5 : 0
        return (
          <svg key={i} className="star" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`g-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--star)" />
                <stop offset={`${fill * 100}%`} stopColor="#ddd" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#g-${i})`}
              d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z"
            />
          </svg>
        )
      })}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="testimonials">
      <h2 className="section-title">המלצות</h2>
      <div className="testimonials__grid">
        {testimonials.map((t, i) => (
          <div key={i} className="testimonial-card">
            <p className="testimonial-card__text">"{t.text}"</p>
            <div className="testimonial-card__footer">
              <Stars rating={t.rating} />
              <span className="testimonial-card__name">{t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
