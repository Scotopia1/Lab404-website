import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

// Create Supabase client with environment variables (kept for backward compatibility)
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Database table definitions for type safety
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user';
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string;
          postal_code: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          postal_code?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          postal_code?: string | null;
          date_of_birth?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          sku: string | null;
          barcode: string | null;
          brand: string | null;
          weight: number | null;
          dimensions: any | null;
          category_id: string | null;
          category: string;
          tags: string[];
          images: string[];
          videos: string[];
          in_stock: boolean;
          stock_quantity: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          specifications: any;
          features: string[];
          slug: string | null;
          meta_title: string | null;
          meta_description: string | null;
          featured: boolean;
          is_active: boolean;
          is_digital: boolean;
          requires_shipping: boolean;
          supplier_id: string | null;
          supplier_sku: string | null;
          alibaba_url: string | null;
          import_data: any | null;
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          brand?: string | null;
          weight?: number | null;
          dimensions?: any | null;
          category_id?: string | null;
          category: string;
          tags?: string[];
          images: string[];
          videos?: string[];
          in_stock?: boolean;
          stock_quantity?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          specifications?: any;
          features?: string[];
          slug?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          featured?: boolean;
          is_active?: boolean;
          is_digital?: boolean;
          requires_shipping?: boolean;
          supplier_id?: string | null;
          supplier_sku?: string | null;
          alibaba_url?: string | null;
          import_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          brand?: string | null;
          weight?: number | null;
          dimensions?: any | null;
          category_id?: string | null;
          category?: string;
          tags?: string[];
          images?: string[];
          videos?: string[];
          in_stock?: boolean;
          stock_quantity?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          specifications?: any;
          features?: string[];
          slug?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          featured?: boolean;
          is_active?: boolean;
          is_digital?: boolean;
          requires_shipping?: boolean;
          supplier_id?: string | null;
          supplier_sku?: string | null;
          alibaba_url?: string | null;
          import_data?: any | null;
          updated_at?: string;
        };
      };
    };
  };
}

// Typed Supabase client
export type TypedSupabaseClient = typeof supabase;

// Helper functions for database operations using Supabase client
export const db = {
  // =============================================
  // PROFILES
  // =============================================
  
  profiles: {
    async get(userId: string) {
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    },
    
    async create(profile: Database['public']['Tables']['profiles']['Insert']) {
      return supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();
    },
    
    async update(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
      return supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    },
    
    async getByEmail(email: string) {
      return supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
    }
  },

  // =============================================
  // CATEGORIES
  // =============================================
  
  categories: {
    async getAll() {
      return supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    },
    
    async get(id: string) {
      return supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
    },
    
    async create(category: Database['public']['Tables']['categories']['Insert']) {
      return supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
    },
    
    async update(id: string, updates: Database['public']['Tables']['categories']['Update']) {
      return supabase
        .from('categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    },
    
    async delete(id: string) {
      return supabase
        .from('categories')
        .delete()
        .eq('id', id);
    }
  },

  // =============================================
  // PRODUCTS
  // =============================================
  
  products: {
    async getAll(options?: { 
      limit?: number;
      offset?: number;
      category?: string;
      featured?: boolean;
      inStock?: boolean;
    }) {
      // Start with basic query without joins to avoid 400 errors
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      
      if (options?.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }
      
      if (options?.inStock !== undefined) {
        query = query.eq('in_stock', options.inStock);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      return query.order('created_at', { ascending: false });
    },
    
    async get(id: string) {
      // Use basic query without joins to avoid 400 errors
      return supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    },
    
    async getFeatured(limit = 6) {
      // Use basic query without joins to avoid 400 errors
      return supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('is_active', true)
        .limit(limit)
        .order('created_at', { ascending: false });
    },
    
    async create(product: Database['public']['Tables']['products']['Insert']) {
      return supabase
        .from('products')
        .insert(product)
        .select()
        .single();
    },
    
    async update(id: string, updates: Database['public']['Tables']['products']['Update']) {
      return supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    },
    
    async delete(id: string) {
      return supabase
        .from('products')
        .delete()
        .eq('id', id);
    },
    
    async search(query: string, options?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
      inStock?: boolean;
      limit?: number;
    }) {
      // Use basic query without joins to avoid 400 errors
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      // Full-text search across name, description, and tags
      if (query) {
        queryBuilder = queryBuilder.or(`
          name.ilike.%${query}%,
          description.ilike.%${query}%,
          tags.cs.{${query}}
        `);
      }
      
      if (options?.category) {
        queryBuilder = queryBuilder.eq('category', options.category);
      }
      
      if (options?.minPrice !== undefined) {
        queryBuilder = queryBuilder.gte('price', options.minPrice);
      }
      
      if (options?.maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('price', options.maxPrice);
      }
      
      if (options?.brand) {
        queryBuilder = queryBuilder.eq('brand', options.brand);
      }
      
      if (options?.inStock !== undefined) {
        queryBuilder = queryBuilder.eq('in_stock', options.inStock);
      }
      
      if (options?.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }
      
      return queryBuilder.order('featured', { ascending: false })
        .order('created_at', { ascending: false });
    }
  }
};