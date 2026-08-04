import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import type { SiteContentResponse } from '../types/content'

export function useSiteContent<T>(key: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<SiteContentResponse<T>>(`/content/site/${key}`)
      .then((response) => setData(response.data))
      .catch(() => setError('טעינת התוכן נכשלה'))
      .finally(() => setLoading(false))
  }, [key])

  return { data, loading, error }
}
