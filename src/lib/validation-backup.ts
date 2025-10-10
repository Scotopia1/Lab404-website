import { z } from 'zod';

// =============================================
// COMMON SCHEMAS
// =============================================

const emailSchema = z.string().email('Invalid email address');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');
const urlSchema = z.string().url('Invalid URL');
const positiveNumberSchema = z.number().positive('Must be a positive number');
const nonNegativeNumberSchema = z.number().min(0, 'Must be 0 or greater');

// =============================================
// USER & PROFILE SCHEMAS
// =============================================

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional().nullable(),
  avatar_url: urlSchema.optional().nullable(),
  role: z.enum(['admin', 'user']).default('user'),
  phone: phoneSchema.optional().nullable(),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  city: z.string().max(100, 'City name too long').optional().nullable(),
  country: z.string().max(100, 'Country name too long').default('Lebanon'),
  postal_code: z.string().max(20, 'Postal code too long').optional().nullable(),
  date_of_birth: z.string().datetime().optional().nullable(),
});

export const createProfileSchema = profileSchema.omit({ 
  id: true 
}).extend({
  id: z.string().uuid()
});

export const updateProfileSchema = profileSchema.partial().omit({ 
  id: true, 
  email: true 
});

// =============================================
// CATEGORY SCHEMAS
// =============================================

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  image_url: urlSchema.optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createCategorySchema = categorySchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateCategorySchema = categorySchema.partial().omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// PRODUCT SCHEMAS
// =============================================

const dimensionsSchema = z.object({
  width: positiveNumberSchema,
  height: positiveNumberSchema,
  depth: positiveNumberSchema,
  unit: z.enum(['cm', 'mm', 'in', 'ft']).default('cm'),
});

const specificationSchema = z.object({
  name: z.string().min(1, 'Specification name is required').max(100),
  value: z.string().min(1, 'Specification value is required').max(200),
});

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  description: z.string().max(2000, 'Description too long').optional().nullable(),
  price: positiveNumberSchema,
  compare_at_price: positiveNumberSchema.optional().nullable(),
  cost_price: nonNegativeNumberSchema.optional().nullable(),
  
  // Product details
  sku: z.string().max(50, 'SKU too long').optional().nullable(),
  barcode: z.string().max(50, 'Barcode too long').optional().nullable(),
  brand: z.string().max(100, 'Brand name too long').optional().nullable(),
  weight: positiveNumberSchema.optional().nullable(),
  dimensions: dimensionsSchema.optional().nullable(),
  
  // Categorization
  category_id: z.string().uuid().optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100),
  tags: z.array(z.string().max(50)).default([]),
  
  // Media
  images: z.array(urlSchema).min(1, 'At least one image is required'),
  videos: z.array(urlSchema).default([]),
  
  // Inventory
  in_stock: z.boolean().default(true),
  stock_quantity: nonNegativeNumberSchema.default(0),
  low_stock_threshold: nonNegativeNumberSchema.default(10),
  track_inventory: z.boolean().default(true),
  
  // Specifications and features
  specifications: z.array(specificationSchema).default([]),
  features: z.array(z.string().max(200)).default([]),
  
  // SEO and metadata
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional().nullable(),
  meta_title: z.string().max(60, 'Meta title too long').optional().nullable(),
  meta_description: z.string().max(160, 'Meta description too long').optional().nullable(),
  
  // Status flags
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_digital: z.boolean().default(false),
  requires_shipping: z.boolean().default(true),
  
  // Supplier integration
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_sku: z.string().max(100).optional().nullable(),
  alibaba_url: urlSchema.optional().nullable(),
  import_data: z.any().optional().nullable(),
  
  // Analytics
  rating: z.number().min(0).max(5).default(0),
  review_count: z.number().int().min(0).default(0),
  
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createProductSchema = productSchema.omit({ 
  id: true, 
  rating: true,
  review_count: true,
  created_at: true, 
  updated_at: true 
});

export const updateProductSchema = productSchema.partial().omit({ 
  id: true, 
  created_at: true 
});

export const productSearchSchema = z.object({
  query: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  minPrice: positiveNumberSchema.optional(),
  maxPrice: positiveNumberSchema.optional(),
  brand: z.string().max(100).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =============================================
// SUPPLIER SCHEMAS
// =============================================

export const supplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Supplier name is required').max(200),
  contact_person: z.string().max(100).optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('China'),
  website: urlSchema.optional().nullable(),
  alibaba_profile: urlSchema.optional().nullable(),
  rating: z.number().min(0).max(5).default(0),
  is_active: z.boolean().default(true),
  payment_terms: z.string().max(200).optional().nullable(),
  shipping_methods: z.array(z.string().max(100)).default([]),
  minimum_order: positiveNumberSchema.optional().nullable(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createSupplierSchema = supplierSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateSupplierSchema = supplierSchema.partial().omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// ORDER SCHEMAS
// =============================================

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).default('Lebanon'),
  phone: phoneSchema,
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  guest_email: emailSchema.optional().nullable(),
  status: z.enum([
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ]).default('pending'),
  payment_status: z.enum([
    'pending', 'paid', 'failed', 'refunded', 'partial'
  ]).default('pending'),
  subtotal: nonNegativeNumberSchema,
  tax_amount: nonNegativeNumberSchema.default(0),
  shipping_amount: nonNegativeNumberSchema.default(0),
  discount_amount: nonNegativeNumberSchema.default(0),
  total_amount: positiveNumberSchema,
  currency: z.string().length(3, 'Invalid currency code').default('USD'),
  notes: z.string().max(1000).optional().nullable(),
  whatsapp_sent: z.boolean().default(false),
  whatsapp_number: phoneSchema.optional().nullable(),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: positiveNumberSchema,
  total_price: positiveNumberSchema,
  product_snapshot: z.any(), // Stores product data at time of order
  created_at: z.string().datetime(),
});

export const createOrderSchema = orderSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
}).extend({
  items: z.array(orderItemSchema.omit({ 
    id: true, 
    order_id: true, 
    created_at: true 
  })).min(1, 'Order must have at least one item'),
});

export const updateOrderSchema = orderSchema.partial().omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// CART SCHEMAS
// =============================================

const baseCartItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity too large'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const cartItemSchema = baseCartItemSchema.refine(
  data => data.user_id || data.session_id,
  { message: 'Either user_id or session_id must be provided' }
);

export const addToCartSchema = baseCartItemSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
}).refine(
  data => data.user_id || data.session_id,
  { message: 'Either user_id or session_id must be provided' }
);

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity too large'),
});

// =============================================
// REVIEW SCHEMAS
// =============================================

export const reviewSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100, 'Review title too long').optional().nullable(),
  comment: z.string().max(2000, 'Review comment too long').optional().nullable(),
  verified_purchase: z.boolean().default(false),
  helpful_count: nonNegativeNumberSchema.default(0),
  is_approved: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createReviewSchema = reviewSchema.omit({ 
  id: true,
  helpful_count: true,
  is_approved: true,
  created_at: true, 
  updated_at: true 
});

export const updateReviewSchema = reviewSchema.partial().omit({ 
  id: true, 
  product_id: true,
  user_id: true,
  created_at: true 
});

// =============================================
// WISHLIST SCHEMAS
// =============================================

export const wishlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export const addToWishlistSchema = wishlistSchema.omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// ANALYTICS SCHEMAS
// =============================================

export const pageViewSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
  page_path: z.string().min(1, 'Page path is required').max(500),
  referrer: urlSchema.optional().nullable(),
  user_agent: z.string().max(1000).optional().nullable(),
  ip_address: z.string().max(45).optional().nullable(), // IPv6 max length
  created_at: z.string().datetime(),
});

export const productViewSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
  view_duration: z.number().int().min(0).optional().nullable(), // in seconds
  created_at: z.string().datetime(),
});

export const trackPageViewSchema = pageViewSchema.omit({ 
  id: true, 
  created_at: true 
});

export const trackProductViewSchema = productViewSchema.omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// AUTHENTICATION SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
}).refine(
  data => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(
  data => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

// =============================================
// VALIDATION HELPERS
// =============================================

export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T; 
  error: null; 
} | { 
  success: false; 
  data: null; 
  error: z.ZodError; 
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, error };
    }
    throw error;
  }
};

export const validatePartialData = <T>(schema: z.ZodObject<any>, data: unknown): { 
  success: true; 
  data: Partial<T>; 
  error: null; 
} | { 
  success: false; 
  data: null; 
  error: z.ZodError; 
} => {
  try {
    const validatedData = schema.partial().parse(data) as Partial<T>;
    return { success: true, data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, error };
    }
    throw error;
  }
};

// Format validation errors for user-friendly display
export const formatValidationErrors = (error: z.ZodError): string[] => {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
};

// Type exports for use in components
export type ProfileData = z.infer<typeof profileSchema>;
export type CreateProfileData = z.infer<typeof createProfileSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export type CategoryData = z.infer<typeof categorySchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

export type ProductData = z.infer<typeof productSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductSearchData = z.infer<typeof productSearchSchema>;

export type SupplierData = z.infer<typeof supplierSchema>;
export type CreateSupplierData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierData = z.infer<typeof updateSupplierSchema>;

export type OrderData = z.infer<typeof orderSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type UpdateOrderData = z.infer<typeof updateOrderSchema>;
export type OrderItemData = z.infer<typeof orderItemSchema>;

export type CartItemData = z.infer<typeof cartItemSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>;

export type ReviewData = z.infer<typeof reviewSchema>;
export type CreateReviewData = z.infer<typeof createReviewSchema>;
export type UpdateReviewData = z.infer<typeof updateReviewSchema>;

export type WishlistData = z.infer<typeof wishlistSchema>;
export type AddToWishlistData = z.infer<typeof addToWishlistSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export type PageViewData = z.infer<typeof pageViewSchema>;
export type ProductViewData = z.infer<typeof productViewSchema>;
export type TrackPageViewData = z.infer<typeof trackPageViewSchema>;
export type TrackProductViewData = z.infer<typeof trackProductViewSchema>;