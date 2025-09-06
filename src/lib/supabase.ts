import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

// Create Supabase client with environment variables
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Database table definitions for type safety
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          brand?: string;
          image: string;
          in_stock: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          brand?: string;
          image: string;
          in_stock?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          brand?: string;
          image?: string;
          in_stock?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Typed Supabase client
export type TypedSupabaseClient = typeof supabase;

// Helper functions for database operations
export const db = {
  // Products
  async getProducts() {
    return supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
  },
  
  async getProduct(id: string) {
    return supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  async createProduct(product: Database['public']['Tables']['products']['Insert']) {
    return supabase
      .from('products')
      .insert(product)
      .select()
      .single();
  },
  
  async updateProduct(id: string, updates: Database['public']['Tables']['products']['Update']) {
    return supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },
  
  async deleteProduct(id: string) {
    return supabase
      .from('products')
      .delete()
      .eq('id', id);
  },
  
  // Search products
  async searchProducts(query: string, category?: string) {
    let queryBuilder = supabase
      .from('products')
      .select('*')
      .ilike('name', `%${query}%`);
    
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category);
    }
    
    return queryBuilder.order('created_at', { ascending: false });
  },
  
  // Get products by category
  async getProductsByCategory(category: string) {
    return supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
  },
  
  // Get featured products
  async getFeaturedProducts() {
    return supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .limit(6);
  }
};