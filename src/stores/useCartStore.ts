import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { db } from '../lib/services/database'
import { realtimeManager } from '../lib/realtime'
import type { CartItemData, ProductData } from '../lib/validation'
import type { ApiResponse } from '../lib/types'

// =============================================
// TYPES
// =============================================

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  compareAtPrice?: number
  quantity: number
  image: string
  category: string
  brand?: string
  inStock: boolean
  maxQuantity?: number
}

export interface CartSummary {
  subtotal: number
  tax: number
  taxRate: number
  shipping: number
  discount: number
  total: number
  itemCount: number
  uniqueItems: number
}

export interface CartStoreState {
  // Data
  items: CartItem[]
  
  // Loading states
  loading: boolean
  syncing: boolean
  
  // Error state
  error: string | null
  
  // Cart settings
  taxRate: number
  shippingThreshold: number // Free shipping threshold
  defaultShipping: number
  
  // UI state
  isOpen: boolean
  
  // User state
  userId: string | null
  isGuest: boolean
  
  // Persistent cart for guests (localStorage)
  guestCartId: string | null
}

export interface CartStoreActions {
  // Item management
  addItem: (product: ProductData, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  
  // Bulk operations
  addMultipleItems: (items: Array<{ product: ProductData; quantity: number }>) => Promise<void>
  removeMultipleItems: (itemIds: string[]) => Promise<void>
  
  // Cart state
  setUserId: (userId: string | null) => void
  syncWithServer: () => Promise<void>
  
  // UI
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Calculations
  getCartSummary: () => CartSummary
  getItemQuantity: (productId: string) => number
  hasItem: (productId: string) => boolean
  
  // Validation
  validateCart: () => Promise<boolean>
  checkInventory: () => Promise<void>
  
  // Utility
  resetCart: () => void
  clearErrors: () => void
  
  // Real-time
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}

export type CartStore = CartStoreState & CartStoreActions

// =============================================
// INITIAL STATE
// =============================================

const initialState: CartStoreState = {
  items: [],
  loading: false,
  syncing: false,
  error: null,
  taxRate: 0, // No tax
  shippingThreshold: 100, // Free shipping over $100
  defaultShipping: 0, // Free delivery for all orders
  isOpen: false,
  userId: null,
  isGuest: true,
  guestCartId: null
}

// =============================================
// HELPER FUNCTIONS
// =============================================

const generateGuestCartId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const convertDbItemToCartItem = (dbItem: CartItemData & { product?: ProductData }): CartItem => {
  const product = dbItem.product
  if (!product) {
    throw new Error('Product data is required for cart item conversion')
  }

  return {
    id: dbItem.id || '',
    productId: dbItem.product_id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compare_at_price || undefined,
    quantity: dbItem.quantity,
    image: product.images?.[0] || '',
    category: product.category,
    brand: product.brand || undefined,
    inStock: product.in_stock,
    maxQuantity: product.stock_quantity || undefined
  }
}

const calculateShipping = (subtotal: number, threshold: number, defaultShipping: number): number => {
  return subtotal >= threshold ? 0 : defaultShipping
}

// =============================================
// STORE IMPLEMENTATION
// =============================================

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // =============================================
        // ITEM MANAGEMENT
        // =============================================

        addItem: async (product: ProductData, quantity = 1) => {
          const state = get()
          set({ loading: true, error: null })

          try {
            // Validate stock
            if (!product.in_stock) {
              throw new Error(`${product.name} is currently out of stock`)
            }

            if (product.stock_quantity && product.stock_quantity < quantity) {
              throw new Error(`Only ${product.stock_quantity} items available for ${product.name}`)
            }

            if (state.userId && !state.isGuest) {
              // Add to server cart
              const response = await db.cart.addItem(state.userId, {
                product_id: product.id,
                quantity
              })

              if (response.error) {
                throw new Error(response.error)
              }

              // The real-time subscription will update the local state
            } else {
              // Add to local cart for guests
              const existingItem = state.items.find(item => item.productId === product.id)
              
              if (existingItem) {
                // Update existing item
                const newQuantity = existingItem.quantity + quantity
                if (product.stock_quantity && newQuantity > product.stock_quantity) {
                  throw new Error(`Only ${product.stock_quantity} items available for ${product.name}`)
                }

                set(prevState => ({
                  items: prevState.items.map(item =>
                    item.productId === product.id
                      ? { ...item, quantity: newQuantity }
                      : item
                  ),
                  loading: false
                }))
              } else {
                // Add new item
                const cartItem: CartItem = {
                  id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  compareAtPrice: product.compare_at_price || undefined,
                  quantity,
                  image: product.images?.[0] || '',
                  category: product.category,
                  brand: product.brand || undefined,
                  inStock: product.in_stock,
                  maxQuantity: product.stock_quantity || undefined
                }

                set(prevState => ({
                  items: [...prevState.items, cartItem],
                  loading: false
                }))
              }

              // Generate guest cart ID if needed
              if (!state.guestCartId) {
                set({ guestCartId: generateGuestCartId() })
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to add item to cart',
              loading: false
            })
            throw error
          }
        },

        removeItem: async (itemId: string) => {
          const state = get()
          set({ loading: true, error: null })

          try {
            if (state.userId && !state.isGuest) {
              // Remove from server cart
              const response = await db.cart.removeItem(state.userId, itemId)
              
              if (response.error) {
                throw new Error(response.error)
              }

              // The real-time subscription will update the local state
            } else {
              // Remove from local cart for guests
              set(prevState => ({
                items: prevState.items.filter(item => item.id !== itemId),
                loading: false
              }))
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to remove item from cart',
              loading: false
            })
          }
        },

        updateQuantity: async (itemId: string, quantity: number) => {
          if (quantity < 1) {
            return get().removeItem(itemId)
          }

          const state = get()
          set({ loading: true, error: null })

          try {
            const item = state.items.find(i => i.id === itemId)
            if (!item) {
              throw new Error('Item not found in cart')
            }

            // Validate stock
            if (item.maxQuantity && quantity > item.maxQuantity) {
              throw new Error(`Only ${item.maxQuantity} items available for ${item.name}`)
            }

            if (state.userId && !state.isGuest) {
              // Update on server
              const response = await db.cart.updateItem(state.userId, itemId, { quantity })
              
              if (response.error) {
                throw new Error(response.error)
              }

              // The real-time subscription will update the local state
            } else {
              // Update local cart for guests
              set(prevState => ({
                items: prevState.items.map(item =>
                  item.id === itemId ? { ...item, quantity } : item
                ),
                loading: false
              }))
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update item quantity',
              loading: false
            })
          }
        },

        clearCart: async () => {
          const state = get()
          set({ loading: true, error: null })

          try {
            if (state.userId && !state.isGuest) {
              // Clear server cart
              const response = await db.cart.clearCart(state.userId)
              
              if (response.error) {
                throw new Error(response.error)
              }

              // The real-time subscription will update the local state
            } else {
              // Clear local cart for guests
              set({
                items: [],
                guestCartId: null,
                loading: false
              })
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to clear cart',
              loading: false
            })
          }
        },

        // =============================================
        // BULK OPERATIONS
        // =============================================

        addMultipleItems: async (itemsToAdd) => {
          const promises = itemsToAdd.map(({ product, quantity }) => 
            get().addItem(product, quantity)
          )
          
          try {
            await Promise.all(promises)
          } catch (error) {
            // Individual items handle their own errors
            console.error('Some items failed to add:', error)
          }
        },

        removeMultipleItems: async (itemIds) => {
          const promises = itemIds.map(id => get().removeItem(id))
          
          try {
            await Promise.all(promises)
          } catch (error) {
            // Individual items handle their own errors
            console.error('Some items failed to remove:', error)
          }
        },

        // =============================================
        // CART STATE MANAGEMENT
        // =============================================

        setUserId: (userId: string | null) => {
          const state = get()
          
          set({
            userId,
            isGuest: !userId
          })

          // If user logged in and has guest cart, sync it
          if (userId && !state.userId && state.items.length > 0) {
            get().syncWithServer()
          }

          // Subscribe to user's cart updates
          if (userId) {
            get().subscribeToUpdates()
          }
        },

        syncWithServer: async () => {
          const state = get()
          
          if (!state.userId || state.isGuest) return

          set({ syncing: true, error: null })

          try {
            // Get server cart
            const response = await db.cart.getCartItems(state.userId)
            
            if (response.error) {
              throw new Error(response.error)
            }

            const serverItems = response.data?.map(convertDbItemToCartItem) || []

            // Merge guest cart with server cart
            const guestItems = state.items
            const mergedItems = [...serverItems]

            for (const guestItem of guestItems) {
              const existingServerItem = serverItems.find(si => si.productId === guestItem.productId)
              
              if (existingServerItem) {
                // Update server item quantity
                const newQuantity = existingServerItem.quantity + guestItem.quantity
                await db.cart.updateItem(state.userId, existingServerItem.id, { quantity: newQuantity })
              } else {
                // Add guest item to server
                await db.cart.addItem(state.userId, {
                  product_id: guestItem.productId,
                  quantity: guestItem.quantity
                })
              }
            }

            // Fetch updated server cart
            const updatedResponse = await db.cart.getCartItems(state.userId)
            if (updatedResponse.data) {
              const updatedItems = updatedResponse.data.map(convertDbItemToCartItem)
              set({
                items: updatedItems,
                guestCartId: null,
                syncing: false
              })
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to sync cart with server',
              syncing: false
            })
          }
        },

        // =============================================
        // UI MANAGEMENT
        // =============================================

        toggleCart: () => {
          set(state => ({ isOpen: !state.isOpen }))
        },

        openCart: () => {
          set({ isOpen: true })
        },

        closeCart: () => {
          set({ isOpen: false })
        },

        // =============================================
        // CALCULATIONS
        // =============================================

        getCartSummary: (): CartSummary => {
          const state = get()
          const items = state.items

          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
          const uniqueItems = items.length

          const shipping = calculateShipping(subtotal, state.shippingThreshold, state.defaultShipping)
          const tax = (subtotal + shipping) * state.taxRate
          // Future enhancement: Implement discount/coupon logic here
          // For now, discounts are not applied
          const discount = 0
          const total = subtotal + tax + shipping - discount

          return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            taxRate: state.taxRate,
            shipping: Math.round(shipping * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(total * 100) / 100,
            itemCount,
            uniqueItems
          }
        },

        getItemQuantity: (productId: string) => {
          const state = get()
          const item = state.items.find(item => item.productId === productId)
          return item ? item.quantity : 0
        },

        hasItem: (productId: string) => {
          const state = get()
          return state.items.some(item => item.productId === productId)
        },

        // =============================================
        // VALIDATION
        // =============================================

        validateCart: async () => {
          const state = get()
          const items = state.items
          let isValid = true
          const errors: string[] = []

          for (const item of items) {
            // Check if product still exists and is in stock
            try {
              const response = await db.products.getById(item.productId)
              
              if (!response.data) {
                errors.push(`${item.name} is no longer available`)
                isValid = false
                continue
              }

              const product = response.data

              if (!product.in_stock) {
                errors.push(`${item.name} is currently out of stock`)
                isValid = false
              }

              if (product.stock_quantity && item.quantity > product.stock_quantity) {
                errors.push(`Only ${product.stock_quantity} items available for ${item.name}`)
                isValid = false
              }

              // Update item with current product data
              if (product.price !== item.price) {
                set(prevState => ({
                  items: prevState.items.map(cartItem =>
                    cartItem.id === item.id
                      ? { ...cartItem, price: product.price }
                      : cartItem
                  )
                }))
              }
            } catch (error) {
              errors.push(`Unable to verify ${item.name}`)
              isValid = false
            }
          }

          if (errors.length > 0) {
            set({ error: errors.join('; ') })
          }

          return isValid
        },

        checkInventory: async () => {
          await get().validateCart()
        },

        // =============================================
        // UTILITY
        // =============================================

        resetCart: () => {
          get().unsubscribeFromUpdates()
          set(initialState)
        },

        clearErrors: () => {
          set({ error: null })
        },

        // =============================================
        // REAL-TIME UPDATES
        // =============================================

        subscribeToUpdates: () => {
          const state = get()
          
          if (!state.userId || state.isGuest) return

          realtimeManager.subscribeToUserData('cart_items', state.userId, {
            onInsert: (payload) => {
              if (payload.new) {
                // This is handled by the server response, so we just refresh
                get().syncWithServer()
              }
            },
            onUpdate: (payload) => {
              if (payload.new) {
                get().syncWithServer()
              }
            },
            onDelete: (payload) => {
              if (payload.old) {
                get().syncWithServer()
              }
            },
            onError: (error) => {
              console.error('Cart realtime error:', error)
            }
          })
        },

        unsubscribeFromUpdates: () => {
          const state = get()
          if (state.userId) {
            realtimeManager.unsubscribe(`cart_items:user_id=eq.${state.userId}`)
          }
        }
      }),
      {
        name: 'lab404-cart-store',
        partialize: (state) => ({
          // Persist guest cart data
          items: state.isGuest ? state.items : [],
          guestCartId: state.guestCartId,
          // Don't persist user data for security
        })
      }
    ),
    { name: 'CartStore' }
  )
)

// =============================================
// SELECTORS (PERFORMANCE OPTIMIZED)
// =============================================

export const useCartItems = () => useCartStore(state => state.items)
export const useCartLoading = () => useCartStore(state => ({ 
  loading: state.loading, 
  syncing: state.syncing 
}))
export const useCartError = () => useCartStore(state => state.error)
export const useCartUI = () => useCartStore(state => ({ 
  isOpen: state.isOpen 
}))
export const useCartSummary = () => useCartStore(state => state.getCartSummary())
export const useCartItemCount = () => useCartStore(state => 
  state.items.reduce((sum, item) => sum + item.quantity, 0)
)

// =============================================
// UTILITY HOOKS
// =============================================

export const useIsInCart = (productId: string) => 
  useCartStore(state => state.hasItem(productId))

export const useItemQuantity = (productId: string) => 
  useCartStore(state => state.getItemQuantity(productId))

export const useCartTotal = () => 
  useCartStore(state => state.getCartSummary().total)

export const useCartActions = () => useCartStore(state => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  toggleCart: state.toggleCart,
  openCart: state.openCart,
  closeCart: state.closeCart
}))