import { useEffect } from 'react'

import { useSiteContent } from '../../hooks/useSiteContent'
import { API_URL } from '../../lib/api'
import type { SeoContent } from '../../types/content'

const DEFAULT_TITLE = 'Savor Kitchens'

export default function SiteMetadata() {
  const { data } = useSiteContent<SeoContent>('seo')

  useEffect(() => {
    if (!data) return

    document.title = data.site_title.trim() || DEFAULT_TITLE

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = data.meta_description.trim()

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon && data.favicon_url.trim()) {
      favicon.href = `${API_URL}/content/favicon`
      favicon.removeAttribute('type')
    }
  }, [data])

  return null
}
