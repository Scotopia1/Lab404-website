import { db } from '../supabase';
import { Product } from '../types';
import { Database } from '../supabase';

// Type for creating products (without generated fields)
export type CreateProductData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  category: string; // Ensure category is required
  images: string[]; // Ensure images array is required
};

// Type for updating products
export type UpdateProductData = Partial<CreateProductData>;

// API response wrapper type
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Product service layer that wraps database operations
 * Provides a clean interface for the import system and other components
 */
export const productService = {
  /**
   * Get all products with optional filters
   */
  async getAll(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    featured?: boolean;
    inStock?: boolean;
  }): Promise<ApiResponse<Product[]>> {
    try {
      const result = await db.products.getAll(options);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to fetch products'
        };
      }

      return {
        data: result.data || [],
        error: null
      };
    } catch (error) {
      console.error('Product service getAll error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get a single product by ID
   */
  async get(id: string): Promise<ApiResponse<Product>> {
    try {
      const result = await db.products.get(id);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to fetch product'
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: 'Product not found'
        };
      }

      return {
        data: result.data as Product,
        error: null
      };
    } catch (error) {
      console.error('Product service get error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get featured products
   */
  async getFeatured(limit = 6): Promise<ApiResponse<Product[]>> {
    try {
      const result = await db.products.getFeatured(limit);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to fetch featured products'
        };
      }

      return {
        data: result.data || [],
        error: null
      };
    } catch (error) {
      console.error('Product service getFeatured error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      // Transform our Product type to the database Insert type
      const dbProduct: Database['public']['Tables']['products']['Insert'] = {
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        compare_at_price: productData.compareAtPrice || null,
        cost_price: productData.costPrice || null,
        sku: productData.sku || null,
        barcode: productData.barcode || null,
        brand: productData.brand || null,
        weight: productData.weight || null,
        dimensions: productData.dimensions || null,
        category: productData.category,
        tags: productData.tags || [],
        images: productData.images,
        videos: productData.videos || [],
        in_stock: productData.inStock ?? true,
        stock_quantity: productData.stockQuantity || 0,
        low_stock_threshold: productData.lowStockThreshold || 5,
        track_inventory: productData.trackInventory ?? true,
        specifications: productData.specifications || {},
        features: productData.features || [],
        slug: productData.slug || null,
        meta_title: productData.metaTitle || null,
        meta_description: productData.metaDescription || null,
        featured: productData.featured ?? false,
        is_active: productData.isActive ?? true,
        is_digital: productData.isDigital ?? false,
        requires_shipping: productData.requiresShipping ?? true,
        supplier_id: productData.supplierId || null,
        supplier_sku: productData.supplierSku || null,
        alibaba_url: productData.alibabaUrl || null,
        import_data: productData.importData || null,
      };

      const result = await db.products.create(dbProduct);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to create product'
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: 'Product creation failed - no data returned'
        };
      }

      return {
        data: result.data as Product,
        error: null
      };
    } catch (error) {
      console.error('Product service create error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Update an existing product
   */
  async updateProduct(id: string, updates: UpdateProductData): Promise<ApiResponse<Product>> {
    try {
      // Transform updates to database Update type
      const dbUpdates: Database['public']['Tables']['products']['Update'] = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.compareAtPrice !== undefined) dbUpdates.compare_at_price = updates.compareAtPrice;
      if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
      if (updates.dimensions !== undefined) dbUpdates.dimensions = updates.dimensions;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.videos !== undefined) dbUpdates.videos = updates.videos;
      if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
      if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
      if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
      if (updates.trackInventory !== undefined) dbUpdates.track_inventory = updates.trackInventory;
      if (updates.specifications !== undefined) dbUpdates.specifications = updates.specifications;
      if (updates.features !== undefined) dbUpdates.features = updates.features;
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
      if (updates.metaTitle !== undefined) dbUpdates.meta_title = updates.metaTitle;
      if (updates.metaDescription !== undefined) dbUpdates.meta_description = updates.metaDescription;
      if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.isDigital !== undefined) dbUpdates.is_digital = updates.isDigital;
      if (updates.requiresShipping !== undefined) dbUpdates.requires_shipping = updates.requiresShipping;
      if (updates.supplierId !== undefined) dbUpdates.supplier_id = updates.supplierId;
      if (updates.supplierSku !== undefined) dbUpdates.supplier_sku = updates.supplierSku;
      if (updates.alibabaUrl !== undefined) dbUpdates.alibaba_url = updates.alibabaUrl;
      if (updates.importData !== undefined) dbUpdates.import_data = updates.importData;

      const result = await db.products.update(id, dbUpdates);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to update product'
        };
      }

      if (!result.data) {
        return {
          data: null,
          error: 'Product update failed - no data returned'
        };
      }

      return {
        data: result.data as Product,
        error: null
      };
    } catch (error) {
      console.error('Product service update error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await db.products.delete(id);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to delete product'
        };
      }

      return {
        data: true,
        error: null
      };
    } catch (error) {
      console.error('Product service delete error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
      inStock?: boolean;
      limit?: number;
    }
  ): Promise<ApiResponse<Product[]>> {
    try {
      const result = await db.products.search(query, options);
      
      if (result.error) {
        return {
          data: null,
          error: result.error.message || 'Failed to search products'
        };
      }

      return {
        data: result.data || [],
        error: null
      };
    } catch (error) {
      console.error('Product service search error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

export default productService;