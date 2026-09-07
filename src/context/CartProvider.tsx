import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { CartContext } from './CartContext'
import type { CartItem } from './CartContext'
import {
  CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY,
  markCartRecoveryNotice,
  sanitizeStoredCart,
} from '../lib/cartStorage'

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
      ?? localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    const cart = sanitizeStoredCart(parsed)
    if (!Array.isArray(parsed) || cart.length !== parsed.length) {
      markCartRecoveryNotice()
    }
    return cart
  } catch {
    markCartRecoveryNotice()
    return []
  }
}

type CartProviderProps = {
  children: ReactNode
}

function cartItemKey(item: CartItem) {
  return item.lineId ?? String(item.id)
}

function mergeCartItems(currentItems: CartItem[], newItems: CartItem[]) {
  const mergedItems = [...currentItems]

  for (const newItem of newItems) {
    const existingIndex = mergedItems.findIndex(
      (item) => cartItemKey(item) === cartItemKey(newItem)
    )

    if (existingIndex === -1) {
      mergedItems.push(newItem)
      continue
    }

    const existingItem = mergedItems[existingIndex]
    mergedItems[existingIndex] = {
      ...existingItem,
      ...newItem,
      quantity: existingItem.quantity + newItem.quantity,
    }
  }

  return mergedItems
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadStoredCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
    } catch {
      // Keep the in-memory cart usable when persistent storage is unavailable.
    }
  }, [cartItems])

  const addToCart = (item: CartItem) => {
    setCartItems((currentItems) => mergeCartItems(currentItems, [item]))
  }

  const addItemsToCart = (items: CartItem[]) => {
    setCartItems((currentItems) => mergeCartItems(currentItems, items))
  }

  const removeFromCart = (id: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => cartItemKey(item) !== String(id))
    )
  }

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        cartItemKey(item) === String(id) ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = useCallback(() => {
    setCartItems((currentItems) => currentItems.length ? [] : currentItems)
  }, [])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        addItemsToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
