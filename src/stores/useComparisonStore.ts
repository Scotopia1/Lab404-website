import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Product } from '@/lib/types';

export interface ComparisonItem extends Product {
  addedAt: number;
}

export interface ComparisonState {
  products: ComparisonItem[];
  maxProducts: number;
  isOpen: boolean;
}

export interface ComparisonActions {
  addProduct: (product: Product) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  canAddMore: () => boolean;
  isInComparison: (productId: string) => boolean;
  getComparisonCount: () => number;
  toggleComparison: () => void;
  setOpen: (open: boolean) => void;
  getComparableFields: () => string[];
  exportComparison: () => string;
  importComparison: (data: string) => boolean;
}

export type ComparisonStore = ComparisonState & ComparisonActions;

const MAX_PRODUCTS = 4; // Reasonable limit for comparison

export const useComparisonStore = create<ComparisonStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        products: [],
        maxProducts: MAX_PRODUCTS,
        isOpen: false,

        // Actions
        addProduct: (product: Product): boolean => {
          const state = get();
          
          // Check if already in comparison
          if (state.products.find(p => p.id === product.id)) {
            return false;
          }

          // Check if at maximum capacity
          if (state.products.length >= state.maxProducts) {
            return false;
          }

          const comparisonItem: ComparisonItem = {
            ...product,
            addedAt: Date.now()
          };

          set({
            products: [...state.products, comparisonItem]
          });

          // Auto-open comparison if this is the second product
          if (state.products.length === 1) {
            set({ isOpen: true });
          }

          return true;
        },

        removeProduct: (productId: string) => {
          set((state) => ({
            products: state.products.filter(p => p.id !== productId)
          }));

          // Close comparison if no products left
          const newState = get();
          if (newState.products.length === 0) {
            set({ isOpen: false });
          }
        },

        clearAll: () => {
          set({
            products: [],
            isOpen: false
          });
        },

        canAddMore: (): boolean => {
          const state = get();
          return state.products.length < state.maxProducts;
        },

        isInComparison: (productId: string): boolean => {
          const state = get();
          return state.products.some(p => p.id === productId);
        },

        getComparisonCount: (): number => {
          return get().products.length;
        },

        toggleComparison: () => {
          set((state) => ({
            isOpen: !state.isOpen
          }));
        },

        setOpen: (open: boolean) => {
          set({ isOpen: open });
        },

        getComparableFields: (): string[] => {
          const state = get();
          if (state.products.length === 0) return [];

          // Get all unique specification keys from all products
          const allSpecs = new Set<string>();
          const commonFields = ['price', 'category', 'brand', 'rating', 'inStock'];

          state.products.forEach(product => {
            product.specifications?.forEach(spec => {
              allSpecs.add(spec.name);
            });
          });

          return [...commonFields, ...Array.from(allSpecs).sort()];
        },

        exportComparison: (): string => {
          const state = get();
          const exportData = {
            products: state.products,
            exportedAt: new Date().toISOString(),
            version: '1.0'
          };
          return JSON.stringify(exportData, null, 2);
        },

        importComparison: (data: string): boolean => {
          try {
            const importData = JSON.parse(data);
            
            if (!importData.products || !Array.isArray(importData.products)) {
              return false;
            }

            // Validate and limit products
            const validProducts = importData.products
              .filter((p: any) => p.id && p.name && typeof p.price === 'number')
              .slice(0, MAX_PRODUCTS);

            set({
              products: validProducts,
              isOpen: validProducts.length > 0
            });

            return true;
          } catch (error) {
            console.error('Failed to import comparison:', error);
            return false;
          }
        }
      }),
      {
        name: 'lab404-product-comparison',
        partialize: (state) => ({
          products: state.products,
          maxProducts: state.maxProducts
          // Don't persist isOpen state
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle version migrations if needed
          return persistedState as ComparisonStore;
        }
      }
    )
  )
);

// Selectors for optimized component updates
export const useComparisonProducts = () => 
  useComparisonStore(state => state.products);

export const useComparisonCount = () => 
  useComparisonStore(state => state.products.length);

export const useComparisonOpen = () => 
  useComparisonStore(state => state.isOpen);

export const useIsInComparison = (productId: string) =>
  useComparisonStore(state => state.products.some(p => p.id === productId));

export const useCanAddToComparison = () =>
  useComparisonStore(state => state.products.length < state.maxProducts);

// Subscribe to comparison changes for analytics
if (typeof window !== 'undefined') {
  useComparisonStore.subscribe(
    (state) => state.products.length,
    (count, prevCount) => {
      // Track comparison events
      if (count > prevCount) {
        // Product added
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'add_to_comparison', {
            event_category: 'engagement',
            event_label: 'product_comparison',
            value: count
          });
        }
      } else if (count < prevCount) {
        // Product removed
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'remove_from_comparison', {
            event_category: 'engagement',
            event_label: 'product_comparison',
            value: count
          });
        }
      }

      // Log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Comparison updated: ${count} products`);
      }
    }
  );
}

export default useComparisonStore;