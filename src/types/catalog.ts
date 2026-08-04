export type ProductType = 'KITCHEN' | 'ACCESSORY' | 'COMPONENT'

export type ProductVariant = {
  id: string
  product_id: string
  color_id: string
  color_label: string
  sku: string
  price: number
  model_url: string
  thumbnail_url?: string | null
  attributes: Record<string, unknown>
  is_active: boolean
  sort_order: number
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
  category?: Category | null
  installation_pdf_url?: string | null
}

export type AdminProduct = {
  id: string
  slug: string
  name: string
  product_type: ProductType
  is_active: boolean
  current_price: number | null
  category_name?: string | null
  primary_image?: string | null
}

export type AdminProductDetail = CatalogProduct & {
  category_id: string | null
  variants: ProductVariant[]
}

export type ConfiguratorProduct = {
  id: string
  slug: string
  name: string
  description?: string | null
  attributes: Record<string, unknown>
  category?: Category | null
  variants: ProductVariant[]
}
