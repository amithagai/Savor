export type ContentPageData = {
  id: string
  slug: string
  title: string
  body: string
  image_url?: string | null
  language: string
  meta_description?: string | null
  is_published: boolean
  updated_at: string
}

export type SiteContentResponse<T> = {
  id: string
  key: string
  data: T
  is_published: boolean
  updated_at: string
}

export type SeoContent = {
  site_title: string
  meta_description: string
  favicon_url: string
}

export type Hotspot = { top: string; left: string; label: string; detail: string }

export type HomeContent = {
  hero: {
    title: string
    subtitle: string
    cta_label: string
    cta_url: string
    image_url: string
    tags: Array<{ label: string; to: string }>
  }
  announcements: string[]
  best_sellers?: {
    title: string
    product_ids: string[]
  }
  materials_title: string
  materials: Array<{ label: string; image_url: string }>
  gallery: {
    image_url: string
    top: Array<{ bg_position: string; hotspot: Hotspot }>
    bottom_hotspot: Hotspot
  }
  testimonials_title: string
  testimonials: Array<{ name: string; rating: number; text: string }>
  newsletter: { title: string; subtitle: string; consent: string }
}

export type FooterContent = {
  service_title: string
  content_title: string
  contact_title: string
  hours: string
  pickup_address: string
  whatsapp_url: string
  whatsapp_phone?: string
  instagram_url: string
  copyright: string
}

export type ContactContent = {
  title: string
  subtitle: string
  success_message: string
  email?: string
}

export type SizeGuideStep = {
  id: string
  title: string
  lead: string
  body: string
  note: string
}

export type SizeGuideContent = {
  subtitle: string
  introduction: string
  steps: SizeGuideStep[]
  closing_title: string
  closing_body: string
  closing_question: string
  closing_note: string
}
