export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  category: string;
  categoryId?: string;
  brand?: string;
  images: string[];
  videos?: string[];
  specifications: Record<string, any>;
  features?: string[];
  tags: string[];
  inStock: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  featured: boolean;
  isActive?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;
  // Enhanced properties for production use
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  rating?: number;
  reviewCount?: number;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  supplierId?: string;
  supplierSku?: string;
  alibabaUrl?: string;
  importData?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy Alibaba interface (kept for compatibility)
export interface AlibabaProduct {
  id: string;
  title: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  minOrderQuantity: number;
  supplier: {
    name: string;
    rating: number;
    location: string;
    responseRate: string;
    onTimeDelivery: string;
  };
  images: string[];
  category: string;
  description: string;
  specifications: Record<string, string>;
  shipping: {
    methods: string[];
    time: string;
    cost: string;
  };
  certifications: string[];
}

// New streamlined Alibaba content interface (content-only)
export interface AlibabaContentProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos?: string[];
  category: string;
  specifications: Record<string, string>;
  tags: string[];
  brand?: string;
  features?: string[];
}

export interface WhatsAppConfig {
  phoneNumber: string;
  businessName: string;
  message?: string;
}

// API Response Types
export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and Filter Types
export interface SearchOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductFilters {
  category: string;
  priceRange: [number, number];
  inStock?: boolean;
  featured?: boolean;
  tags: string[];
  rating?: number;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
}

// Customer Types
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
}

// Enhanced Alibaba Types
export interface ImportedProduct extends Product {
  alibabaProductId?: string;
  supplier?: string;
  moq?: number; // Minimum Order Quantity
  importDate?: string;
}

export interface SupplierInfo {
  id: string;
  name: string;
  rating: number;
  location: string;
  responseRate: string;
  onTimeDelivery: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  certifications: string[];
  minimumOrder: number;
  paymentTerms: string[];
}

export interface ImportOptions {
  markup: number; // Percentage markup from Alibaba price
  featured: boolean;
  category?: string;
  tags?: string[];
  autoPublish: boolean;
}

export interface ImportResult {
  success: boolean;
  product?: Product;
  importId?: string;
  errors?: string[];
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export interface WebVitalsMetrics {
  TTFB: number; // Time to First Byte
  FCP: number;  // First Contentful Paint
  LCP: number;  // Largest Contentful Paint
  CLS: number;  // Cumulative Layout Shift
  FID: number;  // First Input Delay
}

// Error Handling Types
export interface AppError {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Search Result Types
export interface SearchResult {
  product: Product;
  relevance: number;
  highlights?: {
    name?: string;
    description?: string;
    tags?: string[];
  };
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterFacet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options?: FacetOption[];
  range?: { min: number; max: number };
}

// Component Props Types
export interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  isLoading?: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// User and Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Database-specific Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId?: string;
  guestEmail?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  shippingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot?: Record<string, any>;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerified?: boolean;
  isApproved?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface CartItemDB {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}