import { z } from 'zod';

// Quick fix validation - only the essentials we need for the database service

// =============================================
// PRODUCT SCHEMAS
// =============================================

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  in_stock: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  brand: z.string().optional(),
  rating: z.number().min(0).max(5).default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createProductSchema = productSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateProductSchema = productSchema.partial().omit({ 
  id: true, 
  created_at: true 
});

export const productSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  brand: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =============================================
// CATEGORY SCHEMAS
// =============================================

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
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
// SUPPLIER SCHEMAS
// =============================================

export const supplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional(),
  rating: z.number().min(0).max(5).default(0),
  created_at: z.string(),
  updated_at: z.string(),
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
// CART SCHEMAS
// =============================================

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const addToCartSchema = cartItemSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// =============================================
// WISHLIST SCHEMAS
// =============================================

export const wishlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string(),
});

export const addToWishlistSchema = wishlistSchema.omit({ 
  id: true, 
  created_at: true 
});

// =============================================
// PROFILE SCHEMAS
// =============================================

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['admin', 'user']).default('user'),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createProfileSchema = profileSchema.omit({ 
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateProfileSchema = profileSchema.partial().omit({ 
  id: true, 
  email: true,
  created_at: true,
});

// =============================================
// VALIDATION HELPER
// =============================================

export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
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

// =============================================
// TYPE EXPORTS
// =============================================

export type ProductData = z.infer<typeof productSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductSearchData = z.infer<typeof productSearchSchema>;

export type CategoryData = z.infer<typeof categorySchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

export type SupplierData = z.infer<typeof supplierSchema>;
export type CreateSupplierData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierData = z.infer<typeof updateSupplierSchema>;

export type CartItemData = z.infer<typeof cartItemSchema>;
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>;

export type WishlistData = z.infer<typeof wishlistSchema>;
export type AddToWishlistData = z.infer<typeof addToWishlistSchema>;

export type ProfileData = z.infer<typeof profileSchema>;
export type CreateProfileData = z.infer<typeof createProfileSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
