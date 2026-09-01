import { createContext } from 'react'
import type { ProductType } from '../types/catalog'

export type CartItem = {
  id: number | string
  lineId?: string
  name: string
  size?: string
  category?: string
  variant?: string
  variantId?: string
  configurationId?: string
  quantity: number
  price: number
  image?: string
  swatchColor?: string
  productType?: ProductType
  fixedQuantity?: boolean
}

export type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  addItemsToCart: (items: CartItem[]) => void
  removeFromCart: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)
