import { createContext } from 'react'

export type WishlistItem = {
  id: string
  name: string
  subtitle?: string
  price: number
  image?: string
}

export type WishlistContextType = {
  wishlistItems: WishlistItem[]
  isInWishlist: (id: string) => boolean
  toggleWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined)
