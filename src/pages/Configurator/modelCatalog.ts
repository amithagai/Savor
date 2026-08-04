import { cldRawUrl } from '../../lib/cloudinary'

const AVAILABLE_MODELS: Record<string, string[]> = {
  'oven-60': ['cream', 'latte', 'cloud'],
  'shelf-drawer-30': ['cream', 'latte', 'cloud'],
  'shelf-drawer-60': ['cream', 'latte', 'cloud'],
  'base-60-2door': ['cream', 'latte', 'cloud'],
  'base-60-1door': ['cream', 'latte', 'cloud'],
  'base-80-2door': ['cream', 'latte', 'cloud'],
  'three-drawers-60': ['cream', 'latte', 'cloud'],
  'klappa-100': ['cream', 'latte', 'timber', 'cloud'],
  'upper-60': ['cream', 'latte', 'timber', 'cloud'],
  'pantry-60-v2': ['cream', 'latte', 'cloud'],
}

export function availableColorsFor(slug: string | undefined): string[] {
  // A procedural fallback is one complete cream model; real GLBs are already
  // authored with their final color and handles and are shown as fixed variants.
  if (!slug) return ['cream']
  return AVAILABLE_MODELS[slug] ?? ['cream']
}

export function isColorAvailable(slug: string | undefined, color: string): boolean {
  // Products without a model slug have no per-color GLBs; they render
  // procedurally and are treated as available in every color.
  if (!slug) return true
  return AVAILABLE_MODELS[slug]?.includes(color) ?? false
}

export function getModelUrl(slug: string | undefined, color: string): string | undefined {
  if (!slug) return undefined
  if (!AVAILABLE_MODELS[slug]?.includes(color)) return undefined
  return cldRawUrl(`savor/models/${slug}-${color}.glb`)
}
