export type ProductType = 'KITCHEN' | 'CABINET' | 'ACCESSORY' | 'COMPONENT'

export type ImageFit = 'cover' | 'contain'

export type ImageDisplaySettings = {
  fit: ImageFit
  positionX: number
  positionY: number
}

export type ImageDisplayMap = Record<string, ImageDisplaySettings>

export type ProductVariant = {
  id: string
  product_id: string
  color_id: string
  color_label: string
  sku: string
  price: number
  sale_price?: number | null
  model_url: string
  thumbnail_url?: string | null
  attributes: Record<string, unknown>
  is_active: boolean
  sort_order: number
  inventory_tracking: boolean
  initial_stock: number
  stock_quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  allow_preorder: boolean
  in_stock: boolean
}

export type Category = {
  id: string
  slug: string
  name: string
  parent_id?: string | null
  sort_order: number
}

export type CatalogProduct = {
  id: string
  slug: string
  name: string
  description?: string | null
  product_type: ProductType
  attributes: Record<string, unknown>
  images: string[]
  is_active: boolean
  current_price?: number | null
  original_price?: number | null
  category?: Category | null
  installation_pdf_url?: string | null
  sku?: string | null
  inventory_tracking: boolean
  stock_quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  allow_preorder: boolean
  in_stock: boolean
}

export type AdminProduct = {
  id: string
  slug: string
  name: string
  product_type: ProductType
  is_active: boolean
  current_price: number | null
  regular_price: number | null
  original_price: number | null
  category_name?: string | null
  primary_image?: string | null
  sku?: string | null
  inventory_tracking: boolean
  available_quantity: number
  in_stock: boolean
}

export type AdminProductDetail = CatalogProduct & {
  category_id: string | null
  regular_price: number | null
  initial_stock: number
  variants: ProductVariant[]
}

export type InventoryItem = {
  inventory_item_id: string | null
  item_type: 'product' | 'variant'
  product_id: string
  variant_id: string | null
  product_name: string
  variant_label: string | null
  sku: string | null
  is_tracked: boolean
  initial_quantity: number
  stock_quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  allow_preorder: boolean
  status: 'untracked' | 'out' | 'low' | 'available' | 'preorder'
}

export type ConfiguratorProduct = {
  id: string
  slug: string
  name: string
  description?: string | null
  attributes: Record<string, unknown>
  images: string[]
  category?: Category | null
  variants: ProductVariant[]
}
