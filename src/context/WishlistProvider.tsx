import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { WishlistContext } from './WishlistContext'
import type { WishlistItem } from './WishlistContext'

const STORAGE_KEY = 'savor:wishlist'

function loadStoredWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

type WishlistProviderProps = {
  children: ReactNode
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(loadStoredWishlist)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems))
  }, [wishlistItems])

  const isInWishlist = (id: string) => wishlistItems.some((item) => item.id === id)

  const toggleWishlist = (item: WishlistItem) => {
    setWishlistItems((currentItems) =>
      currentItems.some((current) => current.id === item.id)
        ? currentItems.filter((current) => current.id !== item.id)
        : [...currentItems, item],
    )
  }

  const removeFromWishlist = (id: string) => {
    setWishlistItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}
