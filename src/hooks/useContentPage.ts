import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import type { ContentPageData } from '../types/content'

export function useContentPage(slug: string) {
  const [page, setPage] = useState<ContentPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<ContentPageData>(`/content/${slug}`)
      .then(setPage)
      .catch(() => setError('טעינת העמוד נכשלה'))
      .finally(() => setLoading(false))
  }, [slug])

  return { page, loading, error }
}
