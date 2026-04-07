import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ks_cart') || '[]')
    } catch {
      return []
    }
  })

  const saveCart = useCallback((items) => {
    setCartItems(items)
    localStorage.setItem('ks_cart', JSON.stringify(items))
  }, [])

  const addToCart = useCallback((product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      let updated
      if (existing) {
        updated = prev.map(item =>
          item.id === product.id
            ? { ...item, cartQty: item.cartQty + qty }
            : item
        )
      } else {
        updated = [...prev, { ...product, cartQty: qty }]
      }
      localStorage.setItem('ks_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== productId)
      localStorage.setItem('ks_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateQty = useCallback((productId, qty) => {
    setCartItems(prev => {
      const updated = qty <= 0
        ? prev.filter(item => item.id !== productId)
        : prev.map(item =>
            item.id === productId ? { ...item, cartQty: qty } : item
          )
      localStorage.setItem('ks_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    localStorage.removeItem('ks_cart')
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.cartQty, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.cartQty), 0)

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be within CartProvider')
  return ctx
}
