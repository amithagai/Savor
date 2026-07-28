import "../Home.css"

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
              d="M8.03281 1.27141C8.8375 -0.423802 11.1625 -0.423805 11.9672 1.27141L13.3579 4.20118C13.6774 4.87435 14.2951 5.34094 15.0096 5.44888L18.1193 5.91869C19.9187 6.19053 20.6371 8.48954 19.3351 9.80908L17.0849 12.0896C16.5679 12.6136 16.332 13.3685 16.454 14.1084L16.9852 17.3285C17.2926 19.1918 15.4116 20.6126 13.8022 19.7329L11.0208 18.2126C10.3817 17.8633 9.61825 17.8633 8.97917 18.2126L6.19776 19.7329C4.58839 20.6126 2.70742 19.1918 3.01479 17.3286L3.54599 14.1084C3.66804 13.3685 3.43211 12.6136 2.91508 12.0896L0.664875 9.80908C-0.637134 8.48954 0.0813282 6.19053 1.88066 5.91869L4.99037 5.44888C5.70489 5.34094 6.32257 4.87435 6.64211 4.20118L8.03281 1.27141Z"
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
