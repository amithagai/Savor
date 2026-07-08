import { createContext } from 'react'

export type CartItem = {
  id: number
  name: string
  size?: string
  category?: string
  quantity: number
}

export type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)