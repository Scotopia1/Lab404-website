import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { apiClient } from '../api/client'
import { realtimeManager } from '../lib/realtime'
import type { ProductData, ProductSearchData } from '../lib/validation'
import type { PaginatedResponse, ApiResponse } from '../lib/types'

// =============================================
// TYPES
// =============================================

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
  tags?: string[]
  search?: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ProductStoreState {
  // Data
  products: ProductData[]
  featuredProducts: ProductData[]
  currentProduct: ProductData | null
  
  // Loading states
  loading: boolean
  featuredLoading: boolean
  productLoading: boolean
  
  // Error states
  error: string | null
  
  // Filters and pagination
  filters: ProductFilters
  pagination: PaginationState
  
  // Search
  searchQuery: string
  
  // UI state
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'price' | 'rating' | 'newest' | 'featured'
  sortOrder: 'asc' | 'desc'
}

export interface ProductStoreActions {
  // Product fetching
  fetchProducts: () => Promise<void>
  fetchFeaturedProducts: () => Promise<void>
  fetchProductById: (id: string) => Promise<void>
  
  // Search and filters
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<ProductFilters>) => void
  clearFilters: () => void
  
  // Pagination
  setPage: (page: number) => void
  setPageSize: (limit: number) => void
  
  // Sorting
  setSortBy: (sortBy: ProductStoreState['sortBy']) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  
  // UI
  setViewMode: (mode: 'grid' | 'list') => void
  
  // Product management (admin)
  createProduct: (productData: any) => Promise<ApiResponse<ProductData>>
  updateProduct: (id: string, updates: any) => Promise<ApiResponse<ProductData>>
  deleteProduct: (id: string) => Promise<ApiResponse<boolean>>
  
  // Utility
  resetStore: () => void
  clearErrors: () => void
  
  // Real-time updates
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}

export type ProductStore = ProductStoreState & ProductStoreActions

// =============================================
// INITIAL STATE
// =============================================

const initialState: ProductStoreState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  loading: false,
  featuredLoading: false,
  productLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'newest',
  sortOrder: 'desc'
}

// =============================================
// STORE IMPLEMENTATION
// =============================================

export const useProductStore = create<ProductStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // =============================================
        // PRODUCT FETCHING
        // =============================================

        fetchProducts: async () => {
          const state = get()

          set({ loading: true, error: null })

          try {
            const params: any = {
              limit: state.pagination.limit,
              offset: (state.pagination.page - 1) * state.pagination.limit
            }

            // Add filters
            if (state.searchQuery || state.filters.search) {
              params.search = state.searchQuery || state.filters.search
            }
            if (state.filters.category) {
              params.category = state.filters.category
            }
            if (state.filters.brand) {
              params.brand = state.filters.brand
            }
            if (state.filters.minPrice) {
              params.minPrice = state.filters.minPrice
            }
            if (state.filters.maxPrice) {
              params.maxPrice = state.filters.maxPrice
            }
            if (state.filters.inStock !== undefined) {
              params.inStock = state.filters.inStock
            }
            if (state.filters.featured !== undefined) {
              params.featured = state.filters.featured
            }

            const response = await apiClient.getProducts(params)

            set({
              products: response.data || [],
              pagination: {
                page: state.pagination.page,
                limit: state.pagination.limit,
                total: response.pagination?.total || 0,
                totalPages: response.pagination?.totalPages || 0
              },
              loading: false
            })
          } catch (error) {
            console.error('Failed to fetch products:', error)
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch products',
              loading: false
            })
          }
        },

        fetchFeaturedProducts: async () => {
          set({ featuredLoading: true, error: null })

          try {
            const response = await apiClient.getProducts({ featured: true, limit: 8 })

            set({
              featuredProducts: response.data || [],
              featuredLoading: false
            })
          } catch (error) {
            console.error('Failed to fetch featured products:', error)
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch featured products',
              featuredLoading: false
            })
          }
        },

        fetchProductById: async (id: string) => {
          set({ productLoading: true, error: null, currentProduct: null })

          try {
            const product = await apiClient.getProduct(id)

            set({
              currentProduct: product,
              productLoading: false
            })
          } catch (error) {
            console.error('Failed to fetch product:', error)
            set({
              error: error instanceof Error ? error.message : 'Product not found',
              productLoading: false
            })
          }
        },

        // =============================================
        // SEARCH AND FILTERS
        // =============================================

        setSearchQuery: (query: string) => {
          set({ searchQuery: query, pagination: { ...get().pagination, page: 1 } })
          // Auto-fetch when search changes
          get().fetchProducts()
        },

        setFilters: (newFilters: Partial<ProductFilters>) => {
          const currentFilters = get().filters
          set({
            filters: { ...currentFilters, ...newFilters },
            pagination: { ...get().pagination, page: 1 }
          })
          // Auto-fetch when filters change
          get().fetchProducts()
        },

        clearFilters: () => {
          set({
            filters: {},
            searchQuery: '',
            pagination: { ...get().pagination, page: 1 }
          })
          // Auto-fetch when filters are cleared
          get().fetchProducts()
        },

        // =============================================
        // PAGINATION
        // =============================================

        setPage: (page: number) => {
          set({ pagination: { ...get().pagination, page } })
          get().fetchProducts()
        },

        setPageSize: (limit: number) => {
          set({ 
            pagination: { 
              ...get().pagination, 
              limit, 
              page: 1 
            } 
          })
          get().fetchProducts()
        },

        // =============================================
        // SORTING
        // =============================================

        setSortBy: (sortBy: ProductStoreState['sortBy']) => {
          set({ sortBy, pagination: { ...get().pagination, page: 1 } })
          get().fetchProducts()
        },

        setSortOrder: (sortOrder: 'asc' | 'desc') => {
          set({ sortOrder, pagination: { ...get().pagination, page: 1 } })
          get().fetchProducts()
        },

        // =============================================
        // UI
        // =============================================

        setViewMode: (mode: 'grid' | 'list') => {
          set({ viewMode: mode })
        },

        // =============================================
        // PRODUCT MANAGEMENT (ADMIN)
        // =============================================

        createProduct: async (productData: any) => {
          set({ loading: true, error: null })

          try {
            const response = await db.products.create(productData)
            
            if (response.data) {
              // Add to local products array
              set(state => ({
                products: [response.data!, ...state.products],
                loading: false
              }))
              
              // Refresh products to get updated counts
              get().fetchProducts()
            } else {
              set({
                error: response.error,
                loading: false
              })
            }

            return response
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
            set({
              error: errorMessage,
              loading: false
            })
            return { data: null, error: errorMessage }
          }
        },

        updateProduct: async (id: string, updates: any) => {
          set({ loading: true, error: null })

          try {
            const response = await db.products.update(id, updates)
            
            if (response.data) {
              // Update local products array
              set(state => ({
                products: state.products.map(p => p.id === id ? response.data! : p),
                currentProduct: state.currentProduct?.id === id ? response.data : state.currentProduct,
                loading: false
              }))
            } else {
              set({
                error: response.error,
                loading: false
              })
            }

            return response
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update product'
            set({
              error: errorMessage,
              loading: false
            })
            return { data: null, error: errorMessage }
          }
        },

        deleteProduct: async (id: string) => {
          set({ loading: true, error: null })

          try {
            const response = await db.products.delete(id)
            
            if (response.data) {
              // Remove from local products array
              set(state => ({
                products: state.products.filter(p => p.id !== id),
                currentProduct: state.currentProduct?.id === id ? null : state.currentProduct,
                loading: false
              }))
              
              // Refresh products to get updated counts
              get().fetchProducts()
            } else {
              set({
                error: response.error,
                loading: false
              })
            }

            return response
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete product'
            set({
              error: errorMessage,
              loading: false
            })
            return { data: null, error: errorMessage }
          }
        },

        // =============================================
        // UTILITY
        // =============================================

        resetStore: () => {
          set(initialState)
        },

        clearErrors: () => {
          set({ error: null })
        },

        // =============================================
        // REAL-TIME UPDATES
        // =============================================

        subscribeToUpdates: () => {
          // Subscribe to product changes
          realtimeManager.subscribeToTable('products', {
            onInsert: (payload) => {
              if (payload.new) {
                const newProduct = payload.new as ProductData
                set(state => ({
                  products: [newProduct, ...state.products.filter(p => p.id !== newProduct.id)]
                }))
              }
            },
            onUpdate: (payload) => {
              if (payload.new) {
                const updatedProduct = payload.new as ProductData
                set(state => ({
                  products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
                  currentProduct: state.currentProduct?.id === updatedProduct.id ? updatedProduct : state.currentProduct,
                  featuredProducts: state.featuredProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
                }))
              }
            },
            onDelete: (payload) => {
              if (payload.old) {
                const deletedId = (payload.old as ProductData).id
                set(state => ({
                  products: state.products.filter(p => p.id !== deletedId),
                  featuredProducts: state.featuredProducts.filter(p => p.id !== deletedId),
                  currentProduct: state.currentProduct?.id === deletedId ? null : state.currentProduct
                }))
              }
            },
            onError: (error) => {
              console.error('Product realtime error:', error)
            }
          })
        },

        unsubscribeFromUpdates: () => {
          realtimeManager.unsubscribeAll()
        }
      }),
      {
        name: 'lab404-product-store',
        partialize: (state) => ({
          // Only persist UI preferences, not data
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          pagination: {
            ...state.pagination,
            page: 1 // Reset page to 1 on reload
          }
        })
      }
    ),
    { name: 'ProductStore' }
  )
)

// =============================================
// SELECTORS (PERFORMANCE OPTIMIZED)
// =============================================

export const useProducts = () => useProductStore(state => state.products)
export const useFeaturedProducts = () => useProductStore(state => state.featuredProducts)
export const useCurrentProduct = () => useProductStore(state => state.currentProduct)
export const useProductLoading = () => useProductStore(state => ({ 
  loading: state.loading, 
  featuredLoading: state.featuredLoading, 
  productLoading: state.productLoading 
}))
export const useProductError = () => useProductStore(state => state.error)
export const useProductFilters = () => useProductStore(state => state.filters)
export const useProductPagination = () => useProductStore(state => state.pagination)
export const useProductSearch = () => useProductStore(state => state.searchQuery)
export const useProductUI = () => useProductStore(state => ({
  viewMode: state.viewMode,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder
}))

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Get product by ID from store (avoids API call if already loaded)
export const getProductFromStore = (id: string): ProductData | null => {
  const state = useProductStore.getState()
  return state.products.find(p => p.id === id) || 
         state.featuredProducts.find(p => p.id === id) || 
         (state.currentProduct?.id === id ? state.currentProduct : null)
}

// Check if product is in featured products
export const isProductFeatured = (id: string): boolean => {
  const state = useProductStore.getState()
  return state.featuredProducts.some(p => p.id === id)
}

// Get filtered products count
export const getFilteredProductsCount = (): number => {
  const state = useProductStore.getState()
  return state.pagination.total
}

// Check if any filters are active
export const hasActiveFilters = (): boolean => {
  const state = useProductStore.getState()
  return Boolean(
    state.searchQuery ||
    state.filters.category ||
    state.filters.brand ||
    state.filters.minPrice ||
    state.filters.maxPrice ||
    state.filters.inStock !== undefined ||
    state.filters.featured !== undefined ||
    (state.filters.tags && state.filters.tags.length > 0)
  )
}