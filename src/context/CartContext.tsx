import { createContext } from 'react'

export type CartItem = {
  id: number
  name: string
  size?: string
  category?: string
  quantity: number
  price: number
  image?: string
}

export type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)