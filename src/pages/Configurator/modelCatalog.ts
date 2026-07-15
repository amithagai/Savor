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
  'pantry-60-v1': ['cream', 'latte', 'cloud'],
  'pantry-60-v2': ['cream', 'latte', 'cloud'],
}

export function getModelUrl(slug: string | undefined, color: string): string | undefined {
  if (!slug) return undefined
  if (!AVAILABLE_MODELS[slug]?.includes(color)) return undefined
  return cldRawUrl(`savor/models/${slug}-${color}.glb`)
}
