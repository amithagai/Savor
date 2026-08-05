import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { CartContext } from './CartContext'
import type { CartItem } from './CartContext'

const STORAGE_KEY = 'savor:cart'

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (item: CartItem) => {
    setCartItems((currentItems) => mergeCartItems(currentItems, [item]))
  }

  const addItemsToCart = (items: CartItem[]) => {
    setCartItems((currentItems) => mergeCartItems(currentItems, items))
  }

  const removeFromCart = (id: number | string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => cartItemKey(item) !== String(id))
    )
  }

  const updateQuantity = (id: number | string, quantity: number) => {
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
