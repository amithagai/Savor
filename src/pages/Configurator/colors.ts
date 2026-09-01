export type ColorOption = { id: string; label: string; hex: string; texture?: string }

export type ColorSwatchStyle = {
  backgroundColor: string
  backgroundImage?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  backgroundSize?: string
}

export const COLORS: ColorOption[] = [
  { id: 'cloud', label: 'CLOUD', hex: '#D9D9D9' },
  { id: 'cream', label: 'CREAM', hex: '#F1EDE5' },
  { id: 'latte', label: 'LATTE', hex: '#DAD2C9' },
  { id: 'timber', label: 'TIMBER', hex: '#D8C398', texture: '/timber-swatch.png' },
]

// Optional pre-assigned pairs: picking a key auto-selects its partner as the
// second color. Empty until the customer decides how the second color is
// chosen — leave empty for free two-color selection.
export const COLOR_PAIRS: Partial<Record<string, string>> = {}

const DEFAULT_HEX = '#F1EDE5'

const COLOR_ALIASES: Record<string, string[]> = {
  cloud: ['cloud'],
  cream: ['cream', 'craem', 'קרם'],
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

export function colorSwatchStyleOf(
  idOrName?: string | null,
  labelOrName?: string | null,
  fallbackHex?: string,
): ColorSwatchStyle {
  const option = colorOptionOf(idOrName, labelOrName)
  return {
    backgroundColor: option?.hex ?? fallbackHex ?? DEFAULT_HEX,
    ...(option?.texture ? {
      backgroundImage: `url("${option.texture}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    } : {}),
  }
}

export function colorLabelOf(id: string): string {
  return colorOptionOf(id)?.label ?? id.toUpperCase()
}
