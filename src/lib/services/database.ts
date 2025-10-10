import { supabase } from '../supabase'
import * as ValidationTypes from '../validation'
import { validateData } from '../validation'

// Type aliases for easier usage
type ProductData = ValidationTypes.ProductData
type CreateProductData = ValidationTypes.CreateProductData
type UpdateProductData = ValidationTypes.UpdateProductData
type CategoryData = ValidationTypes.CategoryData
type CreateCategoryData = ValidationTypes.CreateCategoryData
type UpdateCategoryData = ValidationTypes.UpdateCategoryData
type SupplierData = ValidationTypes.SupplierData
type CreateSupplierData = ValidationTypes.CreateSupplierData
type UpdateSupplierData = ValidationTypes.UpdateSupplierData
type CartItemData = ValidationTypes.CartItemData
type AddToCartData = ValidationTypes.AddToCartData
type UpdateCartItemData = ValidationTypes.UpdateCartItemData
type WishlistData = ValidationTypes.WishlistData
type AddToWishlistData = ValidationTypes.AddToWishlistData
type ProfileData = ValidationTypes.ProfileData
type CreateProfileData = ValidationTypes.CreateProfileData
type UpdateProfileData = ValidationTypes.UpdateProfileData
type ProductSearchData = ValidationTypes.ProductSearchData
import type { ApiResponse, PaginatedResponse } from '../types'

// =============================================
// DATABASE ERROR HANDLING
// =============================================

class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

const handleDatabaseError = (error: any): string => {
  console.error('Database error:', error)
  
  if (error.code) {
    switch (error.code) {
      case '23505':
        return 'A record with this information already exists'
      case '23503':
        return 'Referenced record not found'
      case '42501':
        return 'Insufficient permissions'
      default:
        return error.message || 'Database operation failed'
    }
  }
  
  return error.message || 'Unknown database error'
}

// =============================================
// PRODUCTS SERVICE
// =============================================

export class ProductsService {
  async getAll(filters: ProductSearchData = {}): Promise<PaginatedResponse<ProductData>> {
    try {
      const { query, category, minPrice, maxPrice, brand, inStock, featured, limit = 20, offset = 0 } = filters
      
      let dbQuery = supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('is_active', true)
      
      // Apply filters
      if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      }
      if (category) {
        dbQuery = dbQuery.eq('category', category)
      }
      if (minPrice !== undefined) {
        dbQuery = dbQuery.gte('price', minPrice)
      }
      if (maxPrice !== undefined) {
        dbQuery = dbQuery.lte('price', maxPrice)
      }
      if (brand) {
        dbQuery = dbQuery.eq('brand', brand)
      }
      if (inStock !== undefined) {
        dbQuery = dbQuery.eq('in_stock', inStock)
      }
      if (featured !== undefined) {
        dbQuery = dbQuery.eq('featured', featured)
      }
      
      // Get total count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Apply pagination and execute query
      const { data, error } = await dbQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      const totalPages = Math.ceil((count || 0) / limit)
      const currentPage = Math.floor(offset / limit) + 1
      
      return {
        data: data || [],
        pagination: {
          page: currentPage,
          limit,
          total: count || 0,
          totalPages
        }
      }
    } catch (error) {
      throw error instanceof DatabaseError ? error : new DatabaseError(handleDatabaseError(error))
    }
  }
  
  async getById(id: string): Promise<ApiResponse<ProductData>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Product not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async create(productData: CreateProductData): Promise<ApiResponse<ProductData>> {
    try {
      const validation = validateData(CreateProductData, productData)
      if (!validation.success) {
        return { data: null, error: 'Invalid product data' }
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert(validation.data)
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .single()
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async update(id: string, updates: UpdateProductData): Promise<ApiResponse<ProductData>> {
    try {
      const validation = validateData(UpdateProductData, updates)
      if (!validation.success) {
        return { data: null, error: 'Invalid update data' }
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(validation.data)
        .eq('id', id)
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Product not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async getFeatured(limit = 8): Promise<ApiResponse<ProductData[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('featured', true)
        .eq('is_active', true)
        .limit(limit)
        .order('created_at', { ascending: false })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// CATEGORIES SERVICE
// =============================================

export class CategoriesService {
  async getAll(): Promise<ApiResponse<CategoryData[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async getById(id: string): Promise<ApiResponse<CategoryData>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Category not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async create(categoryData: CreateCategoryData): Promise<ApiResponse<CategoryData>> {
    try {
      const validation = validateData(CreateCategoryData, categoryData)
      if (!validation.success) {
        return { data: null, error: 'Invalid category data' }
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert(validation.data)
        .select('*')
        .single()
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async update(id: string, updates: UpdateCategoryData): Promise<ApiResponse<CategoryData>> {
    try {
      const validation = validateData(UpdateCategoryData, updates)
      if (!validation.success) {
        return { data: null, error: 'Invalid update data' }
      }
      
      const { data, error } = await supabase
        .from('categories')
        .update(validation.data)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Category not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// SUPPLIERS SERVICE
// =============================================

export class SuppliersService {
  async getAll(): Promise<ApiResponse<SupplierData[]>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async create(supplierData: CreateSupplierData): Promise<ApiResponse<SupplierData>> {
    try {
      const validation = validateData(CreateSupplierData, supplierData)
      if (!validation.success) {
        return { data: null, error: 'Invalid supplier data' }
      }
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert(validation.data)
        .select('*')
        .single()
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// CART SERVICE
// =============================================

export class CartService {
  async getCartItems(userId: string): Promise<ApiResponse<CartItemData[]>> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async addItem(userId: string, cartData: AddToCartData): Promise<ApiResponse<CartItemData>> {
    try {
      const validation = validateData(AddToCartData, { ...cartData, user_id: userId })
      if (!validation.success) {
        return { data: null, error: 'Invalid cart item data' }
      }
      
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', cartData.product_id)
        .single()
      
      if (existingItem) {
        // Update existing item quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + validation.data.quantity })
          .eq('id', existingItem.id)
          .select(`
            *,
            product:products(*)
          `)
          .single()
        
        if (error) throw new DatabaseError(handleDatabaseError(error))
        return { data, error: null }
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert(validation.data)
          .select(`
            *,
            product:products(*)
          `)
          .single()
        
        if (error) throw new DatabaseError(handleDatabaseError(error))
        return { data, error: null }
      }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async updateItem(userId: string, itemId: string, updates: UpdateCartItemData): Promise<ApiResponse<CartItemData>> {
    try {
      const validation = validateData(UpdateCartItemData, updates)
      if (!validation.success) {
        return { data: null, error: 'Invalid update data' }
      }
      
      const { data, error } = await supabase
        .from('cart_items')
        .update(validation.data)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select(`
          *,
          product:products(*)
        `)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Cart item not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async removeItem(userId: string, itemId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async clearCart(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// WISHLIST SERVICE
// =============================================

export class WishlistService {
  async getWishlist(userId: string): Promise<ApiResponse<WishlistData[]>> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async addItem(userId: string, productId: string): Promise<ApiResponse<WishlistData>> {
    try {
      const validation = validateData(AddToWishlistData, { user_id: userId, product_id: productId })
      if (!validation.success) {
        return { data: null, error: 'Invalid wishlist data' }
      }
      
      const { data, error } = await supabase
        .from('wishlists')
        .insert(validation.data)
        .select(`
          *,
          product:products(*)
        `)
        .single()
      
      if (error) {
        if (error.code === '23505') {
          return { data: null, error: 'Item already in wishlist' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async removeItem(userId: string, productId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async isInWishlist(userId: string, productId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data: !!data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// USER PROFILES SERVICE
// =============================================

export class UserProfilesService {
  async getProfile(userId: string): Promise<ApiResponse<ProfileData>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Profile not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async createProfile(profileData: CreateProfileData): Promise<ApiResponse<ProfileData>> {
    try {
      const validation = validateData(CreateProfileData, profileData)
      if (!validation.success) {
        return { data: null, error: 'Invalid profile data' }
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(validation.data)
        .select('*')
        .single()
      
      if (error) throw new DatabaseError(handleDatabaseError(error))
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
  
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<ApiResponse<ProfileData>> {
    try {
      const validation = validateData(UpdateProfileData, updates)
      if (!validation.success) {
        return { data: null, error: 'Invalid update data' }
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(validation.data)
        .eq('id', userId)
        .select('*')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Profile not found' }
        }
        throw new DatabaseError(handleDatabaseError(error))
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof DatabaseError ? error.message : handleDatabaseError(error) }
    }
  }
}

// =============================================
// MAIN DATABASE SERVICE (SINGLETON)
// =============================================

export class DatabaseService {
  private static instance: DatabaseService
  
  public readonly products: ProductsService
  public readonly categories: CategoriesService
  public readonly suppliers: SuppliersService
  public readonly cart: CartService
  public readonly wishlist: WishlistService
  public readonly profiles: UserProfilesService
  
  private constructor() {
    this.products = new ProductsService()
    this.categories = new CategoriesService()
    this.suppliers = new SuppliersService()
    this.cart = new CartService()
    this.wishlist = new WishlistService()
    this.profiles = new UserProfilesService()
  }
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }
  
  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance()