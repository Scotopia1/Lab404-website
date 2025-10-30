// API Client for LAB404 Backend
import { env } from '../lib/env';

// API Configuration
const API_BASE_URL = env.apiBaseUrl;

// Response types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Product interface (matches backend model)
interface Product {
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
  dimensions: Record<string, any> | null;
  category_id: string | null;
  category: string;
  tags: string[];
  images: string[];
  videos: string[];
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  specifications: Record<string, any>;
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
  import_data: Record<string, any> | null;
  rating: number;
  review_count: number;
  created_at: Date;
  updated_at: Date;
}

// Blog interfaces
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  parent_name?: string;
  post_count?: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  images: string[];
  author_id: string;
  category_id: string | null;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  canonical_url: string | null;
  view_count: number;
  reading_time_minutes: number;
  is_featured: boolean;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  author_name?: string;
  author_email?: string;
  category_name?: string;
}

interface CreateBlogPostData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  images?: string[];
  category_id?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  canonical_url?: string;
  is_featured?: boolean;
  published_at?: Date;
}

interface UpdateBlogPostData {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  images?: string[];
  category_id?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  canonical_url?: string;
  is_featured?: boolean;
  published_at?: Date;
}

interface CreateBlogCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface UpdateBlogCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface BlogPostFilters {
  author_id?: string;
  category_id?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  tags?: string[];
  search?: string;
  published_after?: Date;
  published_before?: Date;
  sort_by?: 'title' | 'published_at' | 'created_at' | 'view_count' | 'reading_time_minutes';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface BlogCategoryFilters {
  parent_id?: string | null;
  is_active?: boolean;
  search?: string;
  sort_by?: 'name' | 'sort_order' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Customer interfaces
interface Customer {
  id: string;
  email: string;
  is_active: boolean;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface CustomerName {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string | null;
  is_primary: boolean;
  used_in_orders: number;
  created_at: string;
}

interface CustomerAddress {
  id: string;
  customer_id: string;
  address_line_1: string;
  address_line_2: string | null;
  building: string | null;
  floor: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  is_primary: boolean;
  used_in_orders: number;
  created_at: string;
}

interface CustomerPhone {
  id: string;
  customer_id: string;
  phone: string;
  is_primary: boolean;
  used_in_orders: number;
  created_at: string;
}

interface CustomerWithDetails extends Customer {
  names: CustomerName[];
  addresses: CustomerAddress[];
  phones: CustomerPhone[];
  orders?: any[];
}

interface CustomerFilters {
  search?: string;
  is_active?: boolean;
  min_orders?: number;
  max_orders?: number;
  min_spent?: number;
  max_spent?: number;
  created_from?: string;
  created_to?: string;
  sort_by?: 'created_at' | 'email' | 'total_orders' | 'total_spent';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  page?: number;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'lab404_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'lab404_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'lab404_token_expiry';
  private static readonly USER_DATA_KEY = 'lab404_user_data';

  static getAccessToken(): string | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);

    // Check if token is expired
    if (token && this.isTokenExpired()) {
      console.log('🔓 Access token expired, clearing tokens');
      this.clearTokens();
      return null;
    }

    return token;
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static setTokens(accessToken: string, refreshToken?: string, expiresIn?: string): void {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }

    // Calculate and store expiry time
    if (expiresIn) {
      const expiryTime = this.calculateExpiryTime(expiresIn);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      console.log('🔐 Tokens stored, expires:', new Date(expiryTime).toLocaleString());
    }
  }

  /**
   * Calculate expiry timestamp from expiresIn string (e.g., "7d", "24h")
   */
  private static calculateExpiryTime(expiresIn: string): number {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) {
      // Default to 7 days if format is invalid
      return now + (7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      'd': 24 * 60 * 60 * 1000,  // days
      'h': 60 * 60 * 1000,        // hours
      'm': 60 * 1000,             // minutes
      's': 1000                   // seconds
    };

    return now + (value * (multipliers[unit] || multipliers['d']));
  }

  /**
   * Check if the token is expired
   */
  static isTokenExpired(): boolean {
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) {
      return false; // No expiry set, assume valid
    }

    const expiry = parseInt(expiryStr);
    return Date.now() >= expiry;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static willExpireSoon(): boolean {
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) {
      return false;
    }

    const expiry = parseInt(expiryStr);
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= (expiry - fiveMinutes);
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiryTime(): number | null {
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiryStr ? parseInt(expiryStr) : null;
  }

  /**
   * Cache user data
   */
  static setUserData(userData: any): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  /**
   * Get cached user data
   */
  static getUserData(): any | null {
    const data = localStorage.getItem(this.USER_DATA_KEY);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

// Base API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Build full URL
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  // Get default headers
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = TokenManager.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token attached to request (expires:', TokenManager.getTokenExpiryTime() ? new Date(TokenManager.getTokenExpiryTime()!).toLocaleTimeString() : 'unknown', ')');
      } else {
        console.log('⚠️ No token available for authenticated request');
      }
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      // Handle different error responses
      if (contentType?.includes('application/json')) {
        const errorData: ApiResponse = await response.json();
        throw new ApiError(
          errorData.message || 'Request failed',
          response.status,
          errorData.error,
          errorData.errors
        );
      } else {
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status
        );
      }
    }

    // Handle successful responses
    if (response.status === 204) {
      return {} as T; // No content
    }

    if (contentType?.includes('application/json')) {
      const responseData: any = await response.json();

      // Check if this is a paginated response (has both data and pagination properties)
      if (responseData.data !== undefined && responseData.pagination !== undefined) {
        // Return the entire response structure for paginated responses (blog style)
        return {
          data: responseData.data,
          pagination: responseData.pagination
        } as T;
      }

      // Check if this is a double-nested paginated response (admin products style)
      if (responseData.data && typeof responseData.data === 'object' &&
          responseData.data.data !== undefined && responseData.data.total !== undefined) {
        // Convert admin products structure to standard paginated response
        return {
          data: responseData.data.data,
          pagination: {
            page: responseData.data.page || 1,
            limit: responseData.data.limit || 10,
            total: responseData.data.total,
            totalPages: responseData.data.totalPages || Math.ceil(responseData.data.total / (responseData.data.limit || 10)),
            hasNext: responseData.data.page < (responseData.data.totalPages || Math.ceil(responseData.data.total / (responseData.data.limit || 10))),
            hasPrev: responseData.data.page > 1
          }
        } as T;
      }

      // For non-paginated responses, return just the data
      return responseData.data as T;
    }

    return response.text() as unknown as T;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(includeAuth);

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle token expiration
        if (error.statusCode === 401 && error.errorCode === 'TOKEN_EXPIRED') {
          console.log('🔄 Token expired during request, attempting refresh...');
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('✅ Token refreshed, retrying original request');
            // Retry the original request
            const retryHeaders = this.getHeaders(includeAuth);
            const retryConfig: RequestInit = {
              ...config,
              headers: retryHeaders,
            };
            const response = await fetch(url, retryConfig);
            return await this.handleResponse<T>(response);
          } else {
            // Refresh failed, redirect to login
            console.log('❌ Token refresh failed, clearing tokens and redirecting to login');
            TokenManager.clearTokens();
            window.location.href = '/theElitesSolutions/adminLogin';
          }
        } else if (error.statusCode === 401 || error.statusCode === 403) {
          console.error('🔒 Authentication error:', error.statusCode, error.message);
        }
        throw error;
      }

      // Network or other errors
      console.error('📡 Network error during API request:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let fullUrl = this.buildUrl(endpoint);

    if (params) {
      const url = new URL(fullUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      fullUrl = url.toString();
    }

    const config: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(fullUrl, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle token expiration
        if (error.statusCode === 401 && error.errorCode === 'TOKEN_EXPIRED') {
          console.log('🔄 Token expired during GET request, attempting refresh...');
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('✅ Token refreshed, retrying GET request');
            // Retry the original request
            const retryConfig: RequestInit = {
              ...config,
              headers: this.getHeaders(),
            };
            const response = await fetch(fullUrl, retryConfig);
            return await this.handleResponse<T>(response);
          } else {
            // Refresh failed, redirect to login
            TokenManager.clearTokens();
            window.location.href = '/theElitesSolutions/adminLogin';
          }
        }
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(email: string, password: string): Promise<any> {
    const response = await this.post<any>('/auth/login', { email, password }, false);

    if (response.token) {
      TokenManager.setTokens(response.token, response.refreshToken, response.expiresIn);
      // Cache user data for persistence
      if (response.user) {
        TokenManager.setUserData(response.user);
      }
    }

    return response;
  }

  async register(userData: any): Promise<any> {
    const response = await this.post<any>('/auth/register', userData, false);

    if (response.token) {
      TokenManager.setTokens(response.token, response.refreshToken, response.expiresIn);
      // Cache user data for persistence
      if (response.user) {
        TokenManager.setUserData(response.user);
      }
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      console.log('🔄 Refreshing authentication token...');
      const response = await this.post<any>('/auth/refresh', { refreshToken }, false);

      if (response.token) {
        TokenManager.setTokens(response.token, response.refreshToken, response.expiresIn);
        console.log('✅ Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.log('❌ Token refresh failed, clearing tokens');
      TokenManager.clearTokens();
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/auth/me');
  }

  async updateProfile(profileData: any): Promise<any> {
    return this.put('/auth/me', profileData);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return this.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Product methods
  async getProducts(filters?: any): Promise<PaginatedResponse<Product>> {
    const response = await this.get('/products', filters);
    // Convert numeric fields to ensure they're numbers
    if (response.data) {
      response.data = response.data.map((product: any) => ({
        ...product,
        price: Number(product.price || 0),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
        cost_price: product.cost_price ? Number(product.cost_price) : null,
        weight: product.weight ? Number(product.weight) : null,
        stock_quantity: Number(product.stock_quantity || 0),
        low_stock_threshold: Number(product.low_stock_threshold || 0),
        rating: Number(product.rating || 0),
        review_count: Number(product.review_count || 0),
      }));
    }
    return response;
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.get(`/products/${id}`);
    // Convert numeric fields to ensure they're numbers
    return {
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    };
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const products = await this.get('/products/featured', { limit });
    // Convert numeric fields to ensure they're numbers
    return products.map((product: any) => ({
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    }));
  }

  async searchProducts(query: string, filters?: any): Promise<{
    hits: Product[];
    total: number;
    processingTimeMs: number;
    facets?: any;
  }> {
    const response = await this.post('/search', {
      q: query,
      filters: filters || {},
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
      sort_by: filters?.sort_by,
      sort_order: filters?.sort_order,
      facets: filters?.facets || ['category', 'brand', 'in_stock'],
    });
    
    // Convert numeric fields in hits to ensure they're numbers
    if (response.hits) {
      response.hits = response.hits.map((product: any) => ({
        ...product,
        price: Number(product.price || 0),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
        cost_price: product.cost_price ? Number(product.cost_price) : null,
        weight: product.weight ? Number(product.weight) : null,
        stock_quantity: Number(product.stock_quantity || 0),
        low_stock_threshold: Number(product.low_stock_threshold || 0),
        rating: Number(product.rating || 0),
        review_count: Number(product.review_count || 0),
      }));
    }
    
    return {
      hits: response.hits || [],
      total: response.total || 0,
      processingTimeMs: response.processingTimeMs || 0,
      facets: response.facets,
    };
  }

  async getSuggestions(query: string, limit: number = 5): Promise<any[]> {
    const response = await this.get('/search/suggestions', { q: query, limit });
    return response.suggestions || [];
  }

  async createProduct(productData: any): Promise<Product> {
    const product = await this.post('/products', productData);
    // Convert numeric fields to ensure they're numbers
    return {
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    };
  }

  async updateProduct(id: string, productData: any): Promise<Product> {
    const product = await this.put(`/products/${id}`, productData);
    // Convert numeric fields to ensure they're numbers
    return {
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    };
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete(`/products/${id}`);
  }

  // Category methods
  async getCategories(): Promise<any[]> {
    return this.get('/categories');
  }

  async getCategoryTree(): Promise<any[]> {
    return this.get('/categories/tree');
  }

  async getCategory(id: string): Promise<any> {
    return this.get(`/categories/${id}`);
  }

  async createCategory(categoryData: any): Promise<any> {
    return this.post('/categories', categoryData);
  }

  async updateCategory(id: string, categoryData: any): Promise<any> {
    return this.put(`/categories/${id}`, categoryData);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.delete(`/categories/${id}`);
  }

  // Cart methods
  async getCart(): Promise<any> {
    return this.get('/cart');
  }

  async addToCart(productId: string, quantity: number): Promise<any> {
    return this.post('/cart/items', { product_id: productId, quantity });
  }

  async updateCartItem(id: string, quantity: number): Promise<any> {
    return this.put(`/cart/items/${id}`, { quantity });
  }

  async removeFromCart(id: string): Promise<void> {
    return this.delete(`/cart/items/${id}`);
  }

  // Order methods
  async getOrders(): Promise<any[]> {
    return this.get('/orders');
  }

  async getOrder(id: string): Promise<any> {
    return this.get(`/orders/${id}`);
  }

  async calculateOrder(orderData: any): Promise<any> {
    return this.post('/orders/calculate', orderData);
  }

  async createOrder(orderData: any): Promise<any> {
    return this.post('/orders', orderData);
  }

  // Admin methods
  async getAdminStats(): Promise<any> {
    return this.get('/admin/stats');
  }

  // User management
  async getUsers(filters?: any): Promise<PaginatedResponse<any>> {
    return this.get('/admin/users', filters);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<any> {
    return this.put(`/admin/users/${id}/status`, { is_active: isActive });
  }

  // Product management
  async getAdminProducts(filters?: any): Promise<PaginatedResponse<Product>> {
    const response = await this.get('/admin/products', filters);
    // Convert numeric fields to ensure they're numbers
    if (response.data) {
      response.data = response.data.map((product: any) => ({
        ...product,
        price: Number(product.price || 0),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
        cost_price: product.cost_price ? Number(product.cost_price) : null,
        weight: product.weight ? Number(product.weight) : null,
        stock_quantity: Number(product.stock_quantity || 0),
        low_stock_threshold: Number(product.low_stock_threshold || 0),
        rating: Number(product.rating || 0),
        review_count: Number(product.review_count || 0),
      }));
    }
    return response;
  }

  async createAdminProduct(productData: any): Promise<Product> {
    const product = await this.post('/admin/products', productData);
    // Convert numeric fields to ensure they're numbers
    return {
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    };
  }

  async updateAdminProduct(id: string, productData: any): Promise<Product> {
    const product = await this.put(`/admin/products/${id}`, productData);
    // Convert numeric fields to ensure they're numbers
    return {
      ...product,
      price: Number(product.price || 0),
      compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      weight: product.weight ? Number(product.weight) : null,
      stock_quantity: Number(product.stock_quantity || 0),
      low_stock_threshold: Number(product.low_stock_threshold || 0),
      rating: Number(product.rating || 0),
      review_count: Number(product.review_count || 0),
    };
  }

  async deleteAdminProduct(id: string): Promise<void> {
    return this.delete(`/admin/products/${id}`);
  }

  async bulkProductOperations(action: string, productIds: string[], updateData?: any): Promise<any> {
    return this.post('/admin/products/bulk', { action, productIds, updateData });
  }

  async importProductFromAlibaba(alibabaUrl: string, categoryId?: string, overrides?: any): Promise<any> {
    return this.post('/admin/products/import/alibaba', {
      alibaba_url: alibabaUrl,
      category_id: categoryId,
      overrides
    });
  }

  async previewAlibabaProduct(alibabaUrl: string): Promise<any> {
    return this.post('/admin/products/preview/alibaba', {
      alibaba_url: alibabaUrl
    });
  }

  async getProductStats(): Promise<any> {
    return this.get('/admin/products/stats');
  }

  // Category management
  async getAdminCategories(includeInactive?: boolean): Promise<any[]> {
    return this.get('/admin/categories', { include_inactive: includeInactive });
  }

  async createAdminCategory(categoryData: any): Promise<any> {
    return this.post('/admin/categories', categoryData);
  }

  async updateAdminCategory(id: string, categoryData: any): Promise<any> {
    return this.put(`/admin/categories/${id}`, categoryData);
  }

  async deleteAdminCategory(id: string): Promise<any> {
    return this.delete(`/admin/categories/${id}`);
  }

  async reorderCategories(categoryOrders: Array<{ id: string; sort_order: number }>): Promise<any> {
    return this.post('/admin/categories/reorder', { categoryOrders });
  }

  async getCategoryStats(): Promise<any> {
    return this.get('/admin/categories/stats');
  }

  // Order management
  async getAdminOrders(filters?: any): Promise<PaginatedResponse<any>> {
    return this.get('/admin/orders', filters);
  }

  async getAdminOrder(id: string): Promise<any> {
    return this.get(`/admin/orders/${id}`);
  }

  async createAdminOrder(orderData: any): Promise<any> {
    return this.post('/admin/orders', orderData);
  }

  async updateAdminOrder(id: string, orderData: any): Promise<any> {
    return this.put(`/admin/orders/${id}`, orderData);
  }

  async processRefund(id: string, refundAmount?: number): Promise<any> {
    return this.post(`/admin/orders/${id}/refund`, { refund_amount: refundAmount });
  }

  async markWhatsAppSent(id: string): Promise<any> {
    return this.post(`/admin/orders/${id}/whatsapp`);
  }

  async markOrderAsPaid(id: string, paymentDetails?: {
    payment_date?: string;
    transaction_id?: string;
    payment_notes?: string;
  }): Promise<any> {
    return this.put(`/admin/orders/${id}/mark-paid`, paymentDetails || {});
  }

  async bulkUpdateOrders(orderIds: string[], updates: {
    status?: string;
    payment_status?: string;
    payment_date?: string | null;
  }): Promise<{ updated_count: number; orders: any[] }> {
    return this.post('/admin/orders/bulk-update', {
      order_ids: orderIds,
      ...updates,
    });
  }

  async getOrderStats(): Promise<any> {
    return this.get('/admin/orders/stats');
  }

  async exportOrders(status?: string): Promise<Blob> {
    const url = `${this.baseUrl}/admin/orders/export${status ? `?status=${status}` : ''}`;
    const token = TokenManager.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to export orders: ${errorText}`);
    }

    return response.blob();
  }

  // Analytics endpoints
  async getDashboardAnalytics(days?: number): Promise<any> {
    return this.get('/admin/analytics/dashboard', { days });
  }

  async getSalesAnalytics(period?: string): Promise<any> {
    return this.get('/admin/analytics/sales', { period });
  }

  async getProductAnalytics(days?: number): Promise<any> {
    return this.get('/admin/analytics/products', { days });
  }

  async getOrderAnalytics(): Promise<any> {
    return this.get('/admin/analytics/orders');
  }

  async getAnalytics(days?: number): Promise<any> {
    return this.get('/admin/analytics', { days });
  }

  // Reports
  async generateReport(type: string, dateFrom?: string, dateTo?: string): Promise<any> {
    return this.get('/admin/reports', { type, date_from: dateFrom, date_to: dateTo });
  }

  // System Settings endpoints
  async getSystemSettings(): Promise<any> {
    return this.get('/admin/settings');
  }

  async updateSystemSettings(settings: any): Promise<any> {
    return this.put('/admin/settings', settings);
  }

  async updateSiteConfig(config: any): Promise<any> {
    return this.put('/admin/settings/site', config);
  }

  async updatePaymentSettings(settings: any): Promise<any> {
    return this.put('/admin/settings/payment', settings);
  }

  async updateShippingSettings(settings: any): Promise<any> {
    return this.put('/admin/settings/shipping', settings);
  }

  async updateEmailSettings(settings: any): Promise<any> {
    return this.put('/admin/settings/email', settings);
  }

  async updateSystemPreferences(preferences: any): Promise<any> {
    return this.put('/admin/settings/system', preferences);
  }

  async getTaxSettings(): Promise<any> {
    return this.get('/admin/settings/tax');
  }

  async updateTaxSettings(settings: any): Promise<any> {
    return this.put('/admin/settings/tax', settings);
  }

  async testEmailSettings(settings: any): Promise<any> {
    return this.post('/admin/settings/email/test', settings);
  }

  async backupSystem(): Promise<any> {
    return this.post('/admin/settings/backup');
  }

  async restoreSystem(backupData: any): Promise<any> {
    return this.post('/admin/settings/restore', backupData);
  }

  // Audit & Security endpoints
  async getAuditLogs(filters?: any): Promise<any> {
    return this.get('/admin/audit/logs', filters);
  }

  async getAuditStats(): Promise<any> {
    return this.get('/admin/audit/stats');
  }

  async exportAuditLogs(filters?: any): Promise<any> {
    return this.get('/admin/audit/export', filters);
  }

  async getSecurityConfig(): Promise<any> {
    return this.get('/admin/security/config');
  }

  async updateSecurityConfig(config: any): Promise<any> {
    return this.put('/admin/security/config', config);
  }

  async getSecurityAlerts(): Promise<any> {
    return this.get('/admin/security/alerts');
  }

  async resolveSecurityAlert(alertId: string): Promise<any> {
    return this.post(`/admin/security/alerts/${alertId}/resolve`);
  }

  async getIPWhitelist(): Promise<any> {
    return this.get('/admin/security/ip-whitelist');
  }

  async addIPToWhitelist(ipData: any): Promise<any> {
    return this.post('/admin/security/ip-whitelist', ipData);
  }

  async removeFromWhitelist(id: string): Promise<any> {
    return this.delete(`/admin/security/ip-whitelist/${id}`);
  }

  // Blog API Methods
  // ================

  // Public Blog Methods
  async getBlogPosts(filters?: Partial<BlogPostFilters>): Promise<PaginatedResponse<BlogPost>> {
    return this.get('/blogs/posts', filters);
  }

  async getBlogPost(identifier: string, incrementViews = true): Promise<BlogPost> {
    return this.get(`/blogs/posts/${identifier}`, { increment_views: incrementViews });
  }

  async getRelatedPosts(postId: string, limit = 5): Promise<BlogPost[]> {
    return this.get(`/blogs/posts/${postId}/related`, { limit });
  }

  async getBlogCategories(filters?: Partial<BlogCategoryFilters>): Promise<PaginatedResponse<BlogCategory>> {
    return this.get('/blogs/categories', filters);
  }

  async getBlogCategory(identifier: string): Promise<BlogCategory> {
    return this.get(`/blogs/categories/${identifier}`);
  }

  // Admin Blog Methods
  async getAdminBlogPosts(filters?: Partial<BlogPostFilters>): Promise<PaginatedResponse<BlogPost>> {
    return this.get('/blogs/admin/posts', filters);
  }

  async createBlogPost(postData: CreateBlogPostData): Promise<BlogPost> {
    return this.post('/blogs/admin/posts', postData);
  }

  async updateBlogPost(postId: string, postData: UpdateBlogPostData): Promise<BlogPost> {
    return this.put(`/blogs/admin/posts/${postId}`, postData);
  }

  async deleteBlogPost(postId: string): Promise<void> {
    return this.delete(`/blogs/admin/posts/${postId}`);
  }

  async createBlogCategory(categoryData: CreateBlogCategoryData): Promise<BlogCategory> {
    return this.post('/blogs/admin/categories', categoryData);
  }

  async updateBlogCategory(categoryId: string, categoryData: UpdateBlogCategoryData): Promise<BlogCategory> {
    return this.put(`/blogs/admin/categories/${categoryId}`, categoryData);
  }

  async deleteBlogCategory(categoryId: string): Promise<void> {
    return this.delete(`/blogs/admin/categories/${categoryId}`);
  }

  async setup2FA(): Promise<any> {
    return this.post('/admin/security/2fa/setup');
  }

  async verify2FA(token: string): Promise<any> {
    return this.post('/admin/security/2fa/verify', { token });
  }

  async disable2FA(): Promise<any> {
    return this.post('/admin/security/2fa/disable');
  }

  async generateBackupCodes(): Promise<any> {
    return this.post('/admin/security/2fa/backup-codes');
  }

  // Notification methods
  async getNotifications(): Promise<any> {
    return this.get('/admin/notifications');
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.put(`/admin/notifications/${id}`, { is_read: true });
  }

  async deleteNotification(id: string): Promise<any> {
    return this.delete(`/admin/notifications/${id}`);
  }

  // Review methods
  async getProductReviews(productId: string, params?: {
    page?: number;
    limit?: number;
    sort_by?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
    rating_filter?: number;
    verified_only?: boolean;
  }): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.get(`/reviews/products/${productId}/reviews`, params);
  }

  async getReviewSummary(productId: string): Promise<ReviewSummary> {
    return this.get(`/reviews/products/${productId}/reviews/summary`);
  }

  async getUserReviewForProduct(productId: string): Promise<Review> {
    return this.get(`/reviews/products/${productId}/reviews/mine`);
  }

  async createReview(productId: string, reviewData: {
    user_name: string;
    rating: number;
    title: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }): Promise<Review> {
    return this.post(`/reviews/products/${productId}/reviews`, reviewData);
  }

  async getReviewById(reviewId: string): Promise<Review> {
    return this.get(`/reviews/reviews/${reviewId}`);
  }

  async updateReview(reviewId: string, updateData: {
    rating?: number;
    title?: string;
    comment?: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }): Promise<Review> {
    return this.put(`/reviews/reviews/${reviewId}`, updateData);
  }

  async deleteReview(reviewId: string): Promise<void> {
    return this.delete(`/reviews/reviews/${reviewId}`);
  }

  async markReviewHelpful(reviewId: string, isHelpful: boolean): Promise<{
    helpful_count: number;
    not_helpful_count: number;
  }> {
    return this.post(`/reviews/reviews/${reviewId}/helpful`, { is_helpful: isHelpful });
  }

  // Image upload methods
  async uploadImage(formData: FormData): Promise<{ url: string; fileId: string; originalName: string }> {
    const token = TokenManager.getAccessToken();
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl('/upload/images'), {
      method: 'POST',
      headers,
      body: formData // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload image' }));
      throw new Error(errorData.message || 'Failed to upload image');
    }

    const result: ApiResponse<{ url: string; fileId: string; originalName: string }> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to upload image');
    }

    return result.data;
  }

  async deleteImage(fileId: string): Promise<{ fileId: string }> {
    return this.delete(`/upload/images/${fileId}`);
  }

  // Promo Code methods (public)
  async validatePromoCode(code: string, orderSubtotal: number, cartItems?: Array<{
    sku: string;
    quantity: number;
    price: number;
  }>): Promise<{
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    applies_to: string;
  }> {
    return this.post('/promo-codes/validate', {
      code,
      order_subtotal: orderSubtotal,
      cart_items: cartItems,
    });
  }

  // Admin Promo Code methods
  async getPromoCodes(filters?: {
    code?: string;
    discount_type?: string;
    applies_to?: string;
    is_active?: boolean;
    is_expired?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    promo_codes: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return this.get(`/admin/promo-codes${queryString ? `?${queryString}` : ''}`);
  }

  async getPromoCodeStats(): Promise<{
    total_codes: number;
    active_codes: number;
    expired_codes: number;
    total_uses: number;
    total_discount_given: number;
    most_used_code?: any;
    recent_codes: any[];
  }> {
    return this.get('/admin/promo-codes/stats');
  }

  async getPromoCodeById(id: string): Promise<any> {
    return this.get(`/admin/promo-codes/${id}`);
  }

  async getPromoCodeUsage(id: string): Promise<any[]> {
    return this.get(`/admin/promo-codes/${id}/usage`);
  }

  async createPromoCode(data: {
    code: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    applies_to: string;
    product_skus?: string[];
    max_uses?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }): Promise<any> {
    return this.post('/admin/promo-codes', data);
  }

  async updatePromoCode(id: string, data: Partial<{
    code: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    applies_to: string;
    product_skus?: string[];
    max_uses?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }>): Promise<any> {
    return this.put(`/admin/promo-codes/${id}`, data);
  }

  async deletePromoCode(id: string): Promise<void> {
    return this.delete(`/admin/promo-codes/${id}`);
  }

  async bulkDeletePromoCodes(ids: string[]): Promise<{ deleted_count: number }> {
    return this.post('/admin/promo-codes/bulk-delete', { ids });
  }

  async exportPromoCodes(): Promise<Blob> {
    const token = TokenManager.getAccessToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(this.buildUrl('/admin/promo-codes/export'), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to export promo codes');
    }

    return response.blob();
  }

  async downloadPromoTemplate(): Promise<Blob> {
    const token = TokenManager.getAccessToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(this.buildUrl('/admin/promo-codes/template'), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return response.blob();
  }

  async importPromoCodes(csvData: string): Promise<{
    total_rows: number;
    imported: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    return this.post('/admin/promo-codes/import', { csvData });
  }

  // ============================================
  // Google Images API Methods
  // ============================================

  /**
   * Search Google Images with filters
   */
  async searchGoogleImages(params: {
    query: string;
    limit?: number;
    start?: number;
    safeSearch?: 'off' | 'medium' | 'high';
    imageSize?: 'huge' | 'icon' | 'large' | 'medium' | 'small' | 'xlarge' | 'xxlarge';
    imageType?: 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated';
    fileType?: 'jpg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp' | 'ico';
    imgColorType?: 'color' | 'gray' | 'mono' | 'trans';
    imgDominantColor?: 'black' | 'blue' | 'brown' | 'gray' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'white' | 'yellow';
  }): Promise<any> {
    return this.get('/admin/google-images/search', params);
  }

  /**
   * Download single image from URL and upload to ImageKit
   */
  async downloadGoogleImage(
    imageUrl: string,
    fileName?: string,
    folder?: string
  ): Promise<{
    success: boolean;
    originalUrl: string;
    imagekitUrl?: string;
    imagekitFileId?: string;
    error?: string;
    metadata?: {
      width: number;
      height: number;
      size: number;
      format: string;
    };
  }> {
    return this.post('/admin/google-images/download', {
      imageUrl,
      fileName,
      folder: folder || 'google-images',
    });
  }

  /**
   * Download multiple images in batch and upload to ImageKit
   */
  async downloadGoogleImagesBatch(
    imageUrls: string[],
    folder?: string
  ): Promise<{
    results: Array<{
      success: boolean;
      originalUrl: string;
      imagekitUrl?: string;
      imagekitFileId?: string;
      error?: string;
    }>;
    summary: {
      total: number;
      success: number;
      failed: number;
    };
  }> {
    return this.post('/admin/google-images/download', {
      imageUrls,
      folder: folder || 'google-images',
    });
  }

  // ============================================
  // Quotations API Methods
  // ============================================

  /**
   * Get all quotations with filtering and pagination
   */
  async getQuotations(filters?: Record<string, any>): Promise<PaginatedResponse<any>> {
    return this.get('/quotations', filters);
  }

  /**
   * Get a single quotation by ID
   */
  async getQuotation(id: string, includeHistory: boolean = false): Promise<any> {
    return this.get(`/quotations/${id}`, { include_history: includeHistory });
  }

  /**
   * Create a new quotation
   */
  async createQuotation(data: any): Promise<any> {
    return this.post('/quotations', data);
  }

  /**
   * Update an existing quotation
   */
  async updateQuotation(id: string, data: any): Promise<any> {
    return this.put(`/quotations/${id}`, data);
  }

  /**
   * Change quotation status
   */
  async changeQuotationStatus(id: string, data: any): Promise<any> {
    return this.post(`/quotations/${id}/status`, data);
  }

  /**
   * Approve a quotation
   */
  async approveQuotation(id: string, reason?: string, notes?: string): Promise<any> {
    return this.post(`/quotations/${id}/approve`, { reason, notes });
  }

  /**
   * Reject a quotation
   */
  async rejectQuotation(id: string, reason?: string, notes?: string): Promise<any> {
    return this.post(`/quotations/${id}/reject`, { reason, notes });
  }

  /**
   * Convert quotation to order
   */
  async convertQuotationToOrder(id: string): Promise<any> {
    return this.post(`/quotations/${id}/convert`);
  }

  /**
   * Delete a quotation (drafts only)
   */
  async deleteQuotation(id: string): Promise<void> {
    return this.delete(`/quotations/${id}`);
  }

  /**
   * Get quotation summary/analytics
   */
  async getQuotationSummary(): Promise<any> {
    return this.get('/quotations/summary');
  }

  /**
   * Generate PDF for quotation
   */
  async generateQuotationPDF(id: string): Promise<any> {
    return this.get(`/quotations/${id}/pdf`);
  }

  /**
   * Mark expired quotations (admin utility)
   */
  async markExpiredQuotations(): Promise<any> {
    return this.post('/quotations/mark-expired');
  }

  // Customer management methods
  /**
   * Get all customers (admin only)
   */
  async getCustomers(filters?: CustomerFilters): Promise<PaginatedResponse<CustomerWithDetails>> {
    return this.get('/admin/customers', filters);
  }

  /**
   * Get customer by ID (admin only)
   */
  async getCustomer(id: string): Promise<{
    success: boolean;
    data: CustomerWithDetails;
  }> {
    return this.get(`/admin/customers/${id}`);
  }

  /**
   * Create new customer (admin only)
   */
  async createCustomer(customerData: {
    email: string;
    notes?: string;
    is_active?: boolean;
    name?: {
      first_name: string;
      last_name?: string;
    };
    address?: {
      address_line_1: string;
      address_line_2?: string;
      building?: string;
      floor?: string;
      city: string;
      region?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
    };
    phone?: string;
  }): Promise<CustomerWithDetails> {
    return this.post('/admin/customers', customerData);
  }

  /**
   * Update customer (admin only)
   */
  async updateCustomer(id: string, customerData: {
    email?: string;
    notes?: string;
    is_active?: boolean;
  }): Promise<Customer> {
    return this.put(`/admin/customers/${id}`, customerData);
  }

  /**
   * Delete customer (admin only)
   */
  async deleteCustomer(id: string): Promise<void> {
    return this.delete(`/admin/customers/${id}`);
  }

  /**
   * Get customer orders (admin only)
   */
  async getCustomerOrders(customerId: string): Promise<any[]> {
    return this.get(`/admin/customers/${customerId}/orders`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Review interfaces
interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  images: string[];
  is_approved: boolean;
  created_at: Date;
  updated_at: Date;
  user_helpful_vote?: boolean | null;
}

interface ReviewSummary {
  product_id: string;
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verified_purchases: number;
  recommendation_percentage: number;
}

// Export types and utilities
export { TokenManager };
export type {
  ApiResponse,
  PaginatedResponse,
  BlogPost,
  BlogCategory,
  CreateBlogPostData,
  UpdateBlogPostData,
  CreateBlogCategoryData,
  UpdateBlogCategoryData,
  BlogPostFilters,
  BlogCategoryFilters,
  Review,
  ReviewSummary,
  Customer,
  CustomerName,
  CustomerAddress,
  CustomerPhone,
  CustomerWithDetails,
  CustomerFilters
};