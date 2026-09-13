import type { AccessibilityContent, AccessibilityDocument } from '../types/content'

export const DEFAULT_ACCESSIBILITY_CONTENT: AccessibilityContent = {
  coordinator_name: '',
  coordinator_role: '',
  coordinator_phone: '',
  coordinator_email: '',
  pickup_address: '',
  physical_arrangements: '',
  known_limitations: '',
  last_updated: '2026-09-14',
  documents: [],
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeDocument(value: unknown, index: number): AccessibilityDocument | null {
  if (!value || typeof value !== 'object') return null
  const document = value as Partial<AccessibilityDocument>

  return {
    id: textValue(document.id) || `document-${index + 1}`,
    title: textValue(document.title),
    description: textValue(document.description),
    url: textValue(document.url),
  }
}

export function normalizeAccessibilityContent(value: unknown): AccessibilityContent {
  if (!value || typeof value !== 'object') return { ...DEFAULT_ACCESSIBILITY_CONTENT }
  const content = value as Partial<AccessibilityContent>
  const documents = Array.isArray(content.documents)
    ? content.documents
      .map(normalizeDocument)
      .filter((document): document is AccessibilityDocument => document !== null)
    : []

  return {
    coordinator_name: textValue(content.coordinator_name),
    coordinator_role: textValue(content.coordinator_role),
    coordinator_phone: textValue(content.coordinator_phone),
    coordinator_email: textValue(content.coordinator_email),
    pickup_address: textValue(content.pickup_address),
    physical_arrangements: textValue(content.physical_arrangements),
    known_limitations: textValue(content.known_limitations),
    last_updated: textValue(content.last_updated) || DEFAULT_ACCESSIBILITY_CONTENT.last_updated,
    documents,
  }
}

export function safeAccessibilityDocumentUrl(value: string) {
  const url = value.trim()
  if (url.startsWith('/') && !url.startsWith('//')) return url

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? url : ''
  } catch {
    return ''
  }
}
