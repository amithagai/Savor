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

const COLOR_ALIASES: Record<string, string[]> = {
  cloud: ['cloud'],
  cream: ['cream', 'קרם'],
  latte: ['latte', 'לאטה'],
  timber: ['timber', 'טימבר'],
}

function normalizedTokens(value: string): string[] {
  return value.trim().toLowerCase().split(/[^a-z0-9\u0590-\u05ff]+/).filter(Boolean)
}

export function colorOptionOf(...values: Array<string | null | undefined>): ColorOption | undefined {
  for (const value of values) {
    if (!value) continue
    const tokens = normalizedTokens(value)
    const option = COLORS.find((color) => COLOR_ALIASES[color.id].some((alias) => tokens.includes(alias)))
    if (option) return option
  }
  return undefined
}

export function colorIdOf(...values: Array<string | null | undefined>): string {
  return colorOptionOf(...values)?.id ?? values.find(Boolean)?.trim().toLowerCase() ?? ''
}

export function knownColorHexOf(...values: Array<string | null | undefined>): string | undefined {
  return colorOptionOf(...values)?.hex
}

export function colorHexOf(...values: Array<string | null | undefined>): string {
  return knownColorHexOf(...values) ?? DEFAULT_HEX
}

export function colorLabelOf(id: string): string {
  return colorOptionOf(id)?.label ?? id.toUpperCase()
}
