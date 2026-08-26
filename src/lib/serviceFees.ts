import type { CartItem } from '../context/CartContext'

const STANDARD_INSTALLATION_FEES = new Map<number, number>([
  [1.5, 500],
  [2, 650],
  [2.1, 800],
  [2.6, 950],
  [3.2, 1100],
])

export type ServiceFeeQuote = {
  deliveryFee: number
  installationFee: number
  requiresManualQuote: boolean
  kitchenCount: number
}

export function parseKitchenSizeMeters(value?: string): number | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase().replace(',', '.')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  if (parsed > 10 && /(?:cm|סמ|ס״מ|ס"מ)/.test(normalized)) return parsed / 100
  return parsed
}

function isKitchenItem(item: CartItem) {
  if (item.productType) return item.productType === 'KITCHEN'
  if (item.category?.includes('מטבח')) return true
  const size = parseKitchenSizeMeters(item.size)
  return size != null && STANDARD_INSTALLATION_FEES.has(size) && !item.category
}

function quoteKitchenSize(size: number) {
  const installationFee = STANDARD_INSTALLATION_FEES.get(size) ?? size * 350
  const deliveryFee = size <= 2.6
    ? 600
    : size <= 3.2
      ? 800
      : 800 + (size - 3.2) * 200

  return {
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    installationFee: Math.round(installationFee * 100) / 100,
  }
}

export function quoteCartServiceFees(items: CartItem[]): ServiceFeeQuote {
  let deliveryFee = 0
  let installationFee = 0
  let requiresManualQuote = false
  let kitchenCount = 0

  for (const item of items) {
    if (!isKitchenItem(item)) continue
    const quantity = Math.max(item.quantity, 1)
    kitchenCount += quantity
    const size = parseKitchenSizeMeters(item.size)
    if (size == null) {
      requiresManualQuote = true
      continue
    }
    const quote = quoteKitchenSize(size)
    deliveryFee += quote.deliveryFee * quantity
    installationFee += quote.installationFee * quantity
  }

  if (kitchenCount === 0 && items.length > 0) requiresManualQuote = true

  return { deliveryFee, installationFee, requiresManualQuote, kitchenCount }
}

export function formatServiceFee(amount: number, requiresManualQuote: boolean) {
  const formatted = amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })
  if (!requiresManualQuote) return `${formatted} ₪`
  return amount > 0 ? `${formatted} ₪ + מחיר בתיאום` : 'מחיר בתיאום'
}
