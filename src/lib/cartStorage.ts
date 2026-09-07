import type { CartItem } from '../context/CartContext'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PRODUCT_TYPES = new Set(['KITCHEN', 'CABINET', 'ACCESSORY', 'COMPONENT'])

export const CART_STORAGE_KEY = 'savor:cart:v2'
export const LEGACY_CART_STORAGE_KEY = 'savor:cart'
export const CART_RECOVERY_NOTICE_KEY = 'savor:cart:recovered'

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function isCartReferenceValid(item: {
  id?: unknown
  variantId?: unknown
  configurationId?: unknown
}): boolean {
  return isUuid(item.id)
    && (item.variantId == null || isUuid(item.variantId))
    && (item.configurationId == null || isUuid(item.configurationId))
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function productType(value: unknown): CartItem['productType'] {
  return typeof value === 'string' && PRODUCT_TYPES.has(value)
    ? value as CartItem['productType']
    : undefined
}

function normalizeStoredItem(value: unknown): CartItem | null {
  if (!value || typeof value !== 'object') return null

  const item = value as Record<string, unknown>
  if (!isCartReferenceValid(item) || typeof item.id !== 'string') return null
  if (typeof item.name !== 'string' || !item.name.trim()) return null
  if (!Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 100) return null
  if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) return null

  return {
    id: item.id,
    ...(optionalString(item.lineId) ? { lineId: optionalString(item.lineId) } : {}),
    name: item.name,
    ...(optionalString(item.size) ? { size: optionalString(item.size) } : {}),
    ...(optionalString(item.category) ? { category: optionalString(item.category) } : {}),
    ...(optionalString(item.variant) ? { variant: optionalString(item.variant) } : {}),
    ...(isUuid(item.variantId) ? { variantId: item.variantId } : {}),
    ...(isUuid(item.configurationId) ? { configurationId: item.configurationId } : {}),
    quantity: Number(item.quantity),
    price: item.price,
    ...(optionalString(item.image) ? { image: optionalString(item.image) } : {}),
    ...(optionalString(item.swatchColor) ? { swatchColor: optionalString(item.swatchColor) } : {}),
    ...(productType(item.productType) ? { productType: productType(item.productType) } : {}),
    ...(typeof item.fixedQuantity === 'boolean' ? { fixedQuantity: item.fixedQuantity } : {}),
  }
}

export function sanitizeStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeStoredItem)
    .filter((item): item is CartItem => item !== null)
}

export function markCartRecoveryNotice(): void {
  try {
    sessionStorage.setItem(CART_RECOVERY_NOTICE_KEY, '1')
  } catch {
    // Checkout still works when storage is unavailable (for example, strict privacy mode).
  }
}

export function hasCartRecoveryNotice(): boolean {
  try {
    return sessionStorage.getItem(CART_RECOVERY_NOTICE_KEY) === '1'
  } catch {
    return false
  }
}

export function clearCartRecoveryNotice(): void {
  try {
    sessionStorage.removeItem(CART_RECOVERY_NOTICE_KEY)
  } catch {
    // The notice is optional; checkout must not depend on storage access.
  }
}
