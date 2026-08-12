import type { ImageDisplayMap, ImageDisplaySettings } from '../types/catalog'

export const IMAGE_DISPLAY_ATTRIBUTE = '_image_display'

export const DEFAULT_IMAGE_DISPLAY: ImageDisplaySettings = {
  fit: 'contain',
  positionX: 50,
  positionY: 50,
}

function clampPosition(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 50
}

export function parseImageDisplayMap(value: unknown): ImageDisplayMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([url, rawSettings]) => {
      if (!rawSettings || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) return []
      const settings = rawSettings as Record<string, unknown>
      return [[url, {
        fit: settings.fit === 'cover' ? 'cover' : 'contain',
        positionX: clampPosition(settings.positionX),
        positionY: clampPosition(settings.positionY),
      } satisfies ImageDisplaySettings]]
    }),
  )
}

export function getImageDisplaySettings(
  attributes: Record<string, unknown>,
  image?: string,
  fallback: ImageDisplaySettings = DEFAULT_IMAGE_DISPLAY,
): ImageDisplaySettings {
  if (!image) return fallback
  return parseImageDisplayMap(attributes[IMAGE_DISPLAY_ATTRIBUTE])[image] ?? fallback
}
