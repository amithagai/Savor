const PHONE_FORMATTING_PATTERN = /^[0-9+\s()./\-\u2010-\u2015\u2212\u200e\u200f\u202a-\u202e\u2066-\u2069]+$/

export function normalizeCheckoutText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeIsraeliMobile(value: string): string {
  if (!PHONE_FORMATTING_PATTERN.test(value)) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('9725')) {
    return `0${digits.slice(3)}`
  }
  return digits
}
