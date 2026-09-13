import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { useSiteContent } from '../../hooks/useSiteContent'
import { API_URL } from '../../lib/api'
import type { SeoContent } from '../../types/content'

const DEFAULT_TITLE = 'Savor Kitchens'
const ACCESSIBILITY_TITLE = 'הצהרת נגישות | Savor Kitchens'
const ACCESSIBILITY_DESCRIPTION = 'הצהרת הנגישות של Savor Kitchens, התאמות שבוצעו ודרכי פנייה בנושא נגישות.'

export default function SiteMetadata() {
  const { data } = useSiteContent<SeoContent>('seo')
  const { pathname } = useLocation()

  useEffect(() => {
    const isAccessibilityPage = pathname === '/accessibility'

    document.title = isAccessibilityPage
      ? ACCESSIBILITY_TITLE
      : data?.site_title.trim() || DEFAULT_TITLE

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) {
      description.content = isAccessibilityPage
        ? ACCESSIBILITY_DESCRIPTION
        : data?.meta_description.trim() || ''
    }

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon && data?.favicon_url.trim()) {
      favicon.href = `${API_URL}/content/favicon`
      favicon.removeAttribute('type')
    }
  }, [data, pathname])

  return null
}
