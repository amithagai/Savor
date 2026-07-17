export type ColorOption = { id: string; label: string; hex: string }

export const COLORS: ColorOption[] = [
  { id: 'cream', label: 'CREAM', hex: '#C8AE8A' },
  { id: 'timber', label: 'TIMBER', hex: '#9B7B3E' },
  { id: 'cloud', label: 'CLOUD', hex: '#B4B0AB' },
  { id: 'latte', label: 'LATTE', hex: '#DDD9D4' },
]

// Optional pre-assigned pairs: picking a key auto-selects its partner as the
// second color. Empty until the customer decides how the second color is
// chosen — leave empty for free two-color selection.
export const COLOR_PAIRS: Partial<Record<string, string>> = {}

const DEFAULT_HEX = '#C8AE8A'

export function colorHexOf(id: string): string {
  return COLORS.find(c => c.id === id)?.hex ?? DEFAULT_HEX
}

export function colorLabelOf(id: string): string {
  return COLORS.find(c => c.id === id)?.label ?? id.toUpperCase()
}
