export type ColorOption = { id: string; label: string; hex: string }

export const COLORS: ColorOption[] = [
  { id: 'cloud', label: 'CLOUD', hex: '#D7D8DA' },
  { id: 'cream', label: 'CREAM', hex: '#F2EEE5' },
  { id: 'latte', label: 'LATTE', hex: '#D7CEC1' },
  { id: 'timber', label: 'TIMBER', hex: '#D3A968' },
]

// Optional pre-assigned pairs: picking a key auto-selects its partner as the
// second color. Empty until the customer decides how the second color is
// chosen — leave empty for free two-color selection.
export const COLOR_PAIRS: Partial<Record<string, string>> = {}

const DEFAULT_HEX = '#F2EEE5'

export function colorHexOf(id: string): string {
  return COLORS.find(c => c.id === id)?.hex ?? DEFAULT_HEX
}

export function colorLabelOf(id: string): string {
  return COLORS.find(c => c.id === id)?.label ?? id.toUpperCase()
}
