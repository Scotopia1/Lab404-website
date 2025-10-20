import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// =============================================
// TYPES
// =============================================

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  inStock: boolean;
  maxQuantity?: number;
  selectedVariations?: Record<string, string>;
  addedAt: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  uniqueItemCount: number;
}

export interface CartStore {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  lastSyncAt: string | null;
  
  // Computed
  summary: CartSummary;
  isEmpty: boolean;
  
  // Actions
  addItem: (productId: string, quantity?: number, variations?: Record<string, string>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithDatabase: () => Promise<void>;
  loadCartFromDatabase: () => Promise<void>;
  
  // Utilities
  getItem: (productId: string) => CartItem | undefined;
  isInCart: (productId: string) => boolean;
  getQuantity: (productId: string) => number;
  canAddMore: (productId: string, quantity: number) => boolean;
  
  // Internal actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  generateSessionId: () => string;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItemCount = items.length;
  
  // Tax calculation - No tax applied
  const taxRate = 0;
  const tax = 0;

  // Shipping calculation - $0 delivery fee
  const shipping = 0;
  
  // Discount calculation (placeholder for future promotions)
  const discount = 0;
  
  const total = subtotal + tax + shipping - discount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount,
    uniqueItemCount,
  };
};

// =============================================
// CART STORE
// =============================================

export const useCartStore = create<CartStore>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        items: [],
        isLoading: false,
        error: null,
        sessionId: generateSessionId(),
        lastSyncAt: null,
        
        // Computed properties
        get summary() {
          return calculateCartSummary(get().items);
        },
        
        get isEmpty() {
          return get().items.length === 0;
        },
        
        // Actions
        addItem: async (productId: string, quantity = 1, variations = {}) => {
          const state = get();
          
          try {
            state.setLoading(true);
            state.setError(null);
            
            // Get product details from database
            const { data: product, error: productError } = await db.products.get(productId);
            
            if (productError || !product) {
              throw new Error('Product not found or unavailable');
            }
            
            if (!product.in_stock) {
              throw new Error('Product is out of stock');
            }
            
            set((draft) => {
              const existingItem = draft.items.find(item => 
                item.productId === productId && 
                JSON.stringify(item.selectedVariations) === JSON.stringify(variations)
              );
              
              if (existingItem) {
                // Update existing item quantity
                const newQuantity = existingItem.quantity + quantity;
                const maxQuantity = product.stock_quantity || 100;
                
                if (newQuantity > maxQuantity) {
                  throw new Error(`Cannot add more than ${maxQuantity} items`);
                }
                
                existingItem.quantity = newQuantity;
              } else {
                // Add new item
                const cartItem: CartItem = {
                  id: `${productId}_${Date.now()}`,
                  productId,
                  name: product.name,
                  price: product.price,
                  compareAtPrice: product.compare_at_price,
                  image: product.images[0] || '',
                  quantity,
                  inStock: product.in_stock,
                  maxQuantity: product.stock_quantity || 100,
                  selectedVariations: variations,
                  addedAt: new Date().toISOString(),
                };
                
                draft.items.push(cartItem);
              }
              
              draft.lastSyncAt = new Date().toISOString();
            });
            
            // Sync with database if user is authenticated
            await state.syncWithDatabase();
            
          } catch (error) {
            state.setError(error instanceof Error ? error.message : 'Failed to add item to cart');
            throw error;
          } finally {
            state.setLoading(false);
          }
        },
        
        updateQuantity: async (itemId: string, quantity: number) => {
          const state = get();
          
          if (quantity < 1) {
            return state.removeItem(itemId);
          }
          
          try {
            state.setLoading(true);
            state.setError(null);
            
            set((draft) => {
              const item = draft.items.find(item => item.id === itemId);
              if (item) {
                if (quantity > (item.maxQuantity || 100)) {
                  throw new Error(`Cannot exceed maximum quantity of ${item.maxQuantity}`);
                }
                item.quantity = quantity;
                draft.lastSyncAt = new Date().toISOString();
              }
            });
            
            await state.syncWithDatabase();
            
          } catch (error) {
            state.setError(error instanceof Error ? error.message : 'Failed to update quantity');
            throw error;
          } finally {
            state.setLoading(false);
          }
        },
        
        removeItem: async (itemId: string) => {
          const state = get();
          
          try {
            state.setLoading(true);
            state.setError(null);
            
            set((draft) => {
              draft.items = draft.items.filter(item => item.id !== itemId);
              draft.lastSyncAt = new Date().toISOString();
            });
            
            await state.syncWithDatabase();
            
          } catch (error) {
            state.setError(error instanceof Error ? error.message : 'Failed to remove item');
            throw error;
          } finally {
            state.setLoading(false);
          }
        },
        
        clearCart: async () => {
          const state = get();
          
          try {
            state.setLoading(true);
            state.setError(null);
            
            set((draft) => {
              draft.items = [];
              draft.lastSyncAt = new Date().toISOString();
            });
            
            await state.syncWithDatabase();
            
          } catch (error) {
            state.setError(error instanceof Error ? error.message : 'Failed to clear cart');
            throw error;
          } finally {
            state.setLoading(false);
          }
        },
        
        syncWithDatabase: async () => {
          // Note: This will be called but won't sync if user is not authenticated
          // The actual sync logic would check authentication status
          try {
            // Placeholder for database sync logic
            // In a real implementation, this would sync with Supabase
            console.log('Cart sync with database - placeholder');
          } catch (error) {
            console.error('Failed to sync cart with database:', error);
          }
        },
        
        loadCartFromDatabase: async () => {
          // Load cart from database for authenticated users
          try {
            // Placeholder for database load logic
            console.log('Load cart from database - placeholder');
          } catch (error) {
            console.error('Failed to load cart from database:', error);
          }
        },
        
        // Utility methods
        getItem: (productId: string) => {
          return get().items.find(item => item.productId === productId);
        },
        
        isInCart: (productId: string) => {
          return get().items.some(item => item.productId === productId);
        },
        
        getQuantity: (productId: string) => {
          const item = get().items.find(item => item.productId === productId);
          return item?.quantity || 0;
        },
        
        canAddMore: (productId: string, quantity: number) => {
          const item = get().items.find(item => item.productId === productId);
          const currentQuantity = item?.quantity || 0;
          const maxQuantity = item?.maxQuantity || 100;
          
          return currentQuantity + quantity <= maxQuantity;
        },
        
        // Internal actions
        setLoading: (loading: boolean) => {
          set((draft) => {
            draft.isLoading = loading;
          });
        },
        
        setError: (error: string | null) => {
          set((draft) => {
            draft.error = error;
          });
        },
        
        generateSessionId: () => {
          const newSessionId = generateSessionId();
          set((draft) => {
            draft.sessionId = newSessionId;
          });
          return newSessionId;
        },
      }))
    ),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist items, sessionId, and lastSyncAt
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
        lastSyncAt: state.lastSyncAt,
      }),
      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset loading and error states on rehydration
          state.isLoading = false;
          state.error = null;
          
          // Generate new session ID if not present
          if (!state.sessionId) {
            state.sessionId = generateSessionId();
          }
          
          console.log('Cart rehydrated with', state.items.length, 'items');
        }
      },
    }
  )
);

// =============================================
// CART HOOKS
// =============================================

// Hook for cart summary
export const useCartSummary = () => {
  return useCartStore((state) => state.summary);
};

// Hook for cart items count
export const useCartCount = () => {
  return useCartStore((state) => state.summary.itemCount);
};

// Hook for checking if product is in cart
export const useIsInCart = (productId: string) => {
  return useCartStore((state) => state.isInCart(productId));
};

// Hook for getting product quantity in cart
export const useCartQuantity = (productId: string) => {
  return useCartStore((state) => state.getQuantity(productId));
};

// Hook for cart loading state
export const useCartLoading = () => {
  return useCartStore((state) => state.isLoading);
};

// Hook for cart error state
export const useCartError = () => {
  return useCartStore((state) => state.error);
};

// =============================================
// CART SELECTORS
// =============================================

// Selector for specific cart item
export const selectCartItem = (productId: string) => (state: CartStore) =>
  state.items.find(item => item.productId === productId);

// Selector for cart items by category
export const selectCartItemsByCategory = (category: string) => (state: CartStore) =>
  state.items.filter(item => {
    // This would need product data to filter by category
    // For now, return all items
    return true;
  });

// =============================================
// CART UTILITIES
// =============================================

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
};

// Format cart summary for WhatsApp message
export const formatCartForWhatsApp = (items: CartItem[], summary: CartSummary): string => {
  const header = '🛒 *Order Summary*\n\n';
  
  const itemsList = items
    .map(item => 
      `• ${item.name}\n  Qty: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}\n`
    )
    .join('\n');
  
  const footer = `
*Summary:*
Subtotal: ${formatPrice(summary.subtotal)}
Tax: ${formatPrice(summary.tax)}
Shipping: ${formatPrice(summary.shipping)}
${summary.discount > 0 ? `Discount: -${formatPrice(summary.discount)}\n` : ''}
*Total: ${formatPrice(summary.total)}*

Total Items: ${summary.itemCount}`;

  return header + itemsList + footer;
};

export default useCartStore;