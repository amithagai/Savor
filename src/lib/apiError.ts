type ErrorLike = {
  detail?: unknown
  message?: unknown
  msg?: unknown
}

function messageFromValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const message = value.trim()
    return message || null
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(messageFromValue)
      .filter((message): message is string => Boolean(message))
    return messages.length ? Array.from(new Set(messages)).join(' · ') : null
  }

  if (value && typeof value === 'object') {
    const error = value as ErrorLike
    return messageFromValue(error.message)
      ?? messageFromValue(error.msg)
      ?? messageFromValue(error.detail)
  }

  return null
}

export function formatApiErrorDetail(detail: unknown, fallback: string): string {
  return messageFromValue(detail) ?? fallback
}

export function apiErrorFields(detail: unknown): string[] {
  const fields: string[] = []
  const values = Array.isArray(detail) ? detail : [detail]

  for (const value of values) {
    if (!value || typeof value !== 'object') continue
    const location = (value as { loc?: unknown }).loc
    if (!Array.isArray(location)) continue
    const field = [...location].reverse().find((part) => typeof part === 'string' && part !== 'body')
    if (typeof field === 'string') fields.push(field)
  }

  return Array.from(new Set(fields))
}
