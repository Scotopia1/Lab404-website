# LAB404 E-commerce Platform - Supabase Database Setup Guide

This guide contains all the SQL queries needed to set up the complete database schema for the LAB404 e-commerce platform in Supabase, including tables, security policies, indexes, triggers, and sample data.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Extensions & Types](#extensions--types)
3. [Database Schema](#database-schema)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Database Functions](#database-functions)
6. [Triggers](#triggers)
7. [Indexes](#indexes)
8. [Sample Data](#sample-data)
9. [Verification Queries](#verification-queries)

---

## Prerequisites

Before running these queries, ensure you have:
- A Supabase project created
- Access to the SQL Editor in your Supabase dashboard
- Admin privileges on your Supabase project

---

## Extensions & Types

Run these first to enable required extensions and create custom types:

```sql
-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing and other crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enum types
DO $$ BEGIN
    -- User roles
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Order status types
    CREATE TYPE order_status AS ENUM (
        'pending', 'confirmed', 'processing', 
        'shipped', 'delivered', 'cancelled', 'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Payment status types
    CREATE TYPE payment_status AS ENUM (
        'pending', 'paid', 'failed', 'refunded', 'partial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

---

## Database Schema

### 1. User Profiles Table

Extends Supabase auth.users with additional profile information:

```sql
-- Users profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Lebanon',
    postal_code TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin or user';
COMMENT ON COLUMN public.profiles.country IS 'Default country is Lebanon for LAB404';
```

### 2. Categories Table

Product categories with hierarchical support:

```sql
-- Categories table with hierarchical support
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Product categories with hierarchical structure';
COMMENT ON COLUMN public.categories.parent_id IS 'NULL for top-level categories, category ID for subcategories';
```

### 3. Suppliers Table

Supplier information for Alibaba integration:

```sql
-- Suppliers table for Alibaba integration
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'China',
    website TEXT,
    alibaba_profile TEXT,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    payment_terms TEXT,
    shipping_methods TEXT[] DEFAULT '{}',
    minimum_order DECIMAL(10,2) CHECK (minimum_order >= 0),
    lead_time_days INTEGER CHECK (lead_time_days >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.suppliers IS 'Supplier information for product sourcing and Alibaba integration';
COMMENT ON COLUMN public.suppliers.rating IS 'Supplier rating from 0.0 to 5.0';
```

### 4. Products Table

Main products table with comprehensive e-commerce features:

```sql
-- Products table (enhanced schema)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    
    -- Product identification
    sku TEXT UNIQUE,
    barcode TEXT,
    brand TEXT,
    weight DECIMAL(8,2),
    dimensions JSONB, -- {width, height, depth, unit}
    
    -- Categorization
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- Backward compatibility
    tags TEXT[] DEFAULT '{}',
    
    -- Media
    images TEXT[] DEFAULT '{}' NOT NULL CHECK (array_length(images, 1) >= 1),
    videos TEXT[] DEFAULT '{}',
    
    -- Inventory management
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    track_inventory BOOLEAN DEFAULT true,
    
    -- Specifications and features
    specifications JSONB DEFAULT '[]'::jsonb, -- [{name, value}]
    features TEXT[] DEFAULT '{}',
    
    -- SEO and metadata
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    
    -- Status flags
    featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    
    -- Supplier integration
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_sku TEXT,
    alibaba_url TEXT,
    import_data JSONB, -- Store Alibaba import metadata
    
    -- Analytics (automatically updated by triggers)
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Main products table with comprehensive e-commerce features';
COMMENT ON COLUMN public.products.specifications IS 'Product specifications as JSON array of {name, value} objects';
COMMENT ON COLUMN public.products.dimensions IS 'Product dimensions as JSON: {width, height, depth, unit}';
```

### 5. Orders & Order Items Tables

Order management system:

```sql
-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_email TEXT,
    
    -- Order status
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency CHAR(3) DEFAULT 'USD',
    
    -- Order details
    notes TEXT,
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_number TEXT,
    
    -- Addresses (stored as JSON)
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_guest_or_user CHECK (
        (user_id IS NOT NULL) OR (guest_email IS NOT NULL)
    )
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    
    -- Item details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Product snapshot at time of order (for historical reference)
    product_snapshot JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Customer orders with support for both authenticated and guest users';
COMMENT ON TABLE public.order_items IS 'Individual items within an order with product snapshots';
```

### 6. Shopping Cart Table

Persistent shopping cart for users and guests:

```sql
-- Shopping cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest users
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or session_id is provided
    CONSTRAINT valid_user_or_session CHECK (
        (user_id IS NOT NULL) OR (session_id IS NOT NULL)
    ),
    
    -- Unique constraint to prevent duplicate items
    UNIQUE(user_id, session_id, product_id)
);

COMMENT ON TABLE public.cart_items IS 'Shopping cart items for both authenticated users and guests';
```

### 7. Wishlists Table

User wishlist functionality:

```sql
-- User wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate wishlist items
    UNIQUE(user_id, product_id)
);

COMMENT ON TABLE public.wishlists IS 'User wishlists for saving favorite products';
```

### 8. Reviews Table

Product review system:

```sql
-- Product reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    
    -- Review metadata
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    is_approved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate reviews from same user
    UNIQUE(product_id, user_id)
);

COMMENT ON TABLE public.reviews IS 'Product reviews with approval workflow';
COMMENT ON COLUMN public.reviews.verified_purchase IS 'True if reviewer purchased the product';
```

### 9. Analytics Tables

Track user behavior and product views:

```sql
-- Page views analytics
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product views analytics  
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    view_duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.page_views IS 'Analytics tracking for page views';
COMMENT ON TABLE public.product_views IS 'Analytics tracking for product page views';
```

---

## Row Level Security (RLS)

Enable RLS and create security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Suppliers policies (admin only)
CREATE POLICY "Admins can manage suppliers" ON public.suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products policies (public read active products, admin write)
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies (users see own orders, admins see all)
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Order items policies
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND (user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

-- Cart policies (users manage own cart)
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Guests can manage session cart" ON public.cart_items
    FOR ALL USING (user_id IS NULL);

-- Wishlist policies (users manage own wishlist)
CREATE POLICY "Users can manage own wishlist" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Reviews policies (public read approved, users write own)
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Analytics policies (insert only for tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert product views" ON public.product_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics" ON public.page_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view product analytics" ON public.product_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## Database Functions

Useful functions for the application:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate product rating from reviews
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products SET 
        rating = (
            SELECT COALESCE(ROUND(AVG(rating::numeric), 2), 0)
            FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND is_approved = true
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND is_approved = true
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;
```

---

## Triggers

Set up automatic triggers:

```sql
-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON public.suppliers 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON public.cart_items 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for product rating updates
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE update_product_rating();

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## Indexes

Create performance indexes:

```sql
-- Indexes for better query performance

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products 
USING gin((name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_page_views_user ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON public.product_views(created_at);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON public.suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON public.suppliers(rating);
```

---

## Sample Data

Insert comprehensive test data:

```sql
-- Insert sample categories
INSERT INTO public.categories (id, name, description, image_url, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Electronics', 'Electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', 1, true),
('550e8400-e29b-41d4-a716-446655440001', 'Smartphones', 'Mobile phones and accessories', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 2, true),
('550e8400-e29b-41d4-a716-446655440002', 'Laptops', 'Laptops and notebook computers', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 3, true),
('550e8400-e29b-41d4-a716-446655440003', 'Accessories', 'Electronic accessories and peripherals', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400', 4, true),
('550e8400-e29b-41d4-a716-446655440004', 'Gaming', 'Gaming devices and accessories', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400', 5, true),
('550e8400-e29b-41d4-a716-446655440005', 'Audio', 'Headphones, speakers and audio equipment', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 6, true);

-- Insert subcategories
INSERT INTO public.categories (id, name, description, parent_id, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'iPhone', 'Apple iPhones', '550e8400-e29b-41d4-a716-446655440001', 1, true),
('550e8400-e29b-41d4-a716-446655440011', 'Samsung Galaxy', 'Samsung Galaxy series', '550e8400-e29b-41d4-a716-446655440001', 2, true),
('550e8400-e29b-41d4-a716-446655440012', 'Gaming Laptops', 'High-performance gaming laptops', '550e8400-e29b-41d4-a716-446655440002', 1, true),
('550e8400-e29b-41d4-a716-446655440013', 'Business Laptops', 'Professional business laptops', '550e8400-e29b-41d4-a716-446655440002', 2, true);

-- Insert sample suppliers
INSERT INTO public.suppliers (id, name, contact_person, email, phone, address, city, country, website, alibaba_profile, rating, payment_terms, shipping_methods, minimum_order, lead_time_days) VALUES
('650e8400-e29b-41d4-a716-446655440000', 'TechSource Electronics', 'John Chen', 'john@techsource.com', '+86-138-0013-8000', '123 Tech Street', 'Shenzhen', 'China', 'https://techsource.com', 'https://techsource.en.alibaba.com', 4.5, 'T/T 30% deposit, 70% before shipment', ARRAY['DHL', 'FedEx', 'Sea Freight'], 1000.00, 15),
('650e8400-e29b-41d4-a716-446655440001', 'Global Electronics Co.', 'Lisa Wang', 'lisa@globalelec.com', '+86-138-0013-8001', '456 Electronics Ave', 'Guangzhou', 'China', 'https://globalelec.com', 'https://globalelec.en.alibaba.com', 4.8, 'L/C at sight', ARRAY['DHL', 'UPS', 'Air Freight'], 2000.00, 10),
('650e8400-e29b-41d4-a716-446655440002', 'Premium Tech Solutions', 'David Liu', 'david@premiumtech.com', '+86-138-0013-8002', '789 Innovation Blvd', 'Shanghai', 'China', 'https://premiumtech.com', 'https://premiumtech.en.alibaba.com', 4.3, 'Western Union, PayPal', ARRAY['FedEx', 'TNT'], 500.00, 20),
('650e8400-e29b-41d4-a716-446655440003', 'Smart Devices Inc.', 'Sarah Zhang', 'sarah@smartdevices.com', '+86-138-0013-8003', '321 Smart Plaza', 'Beijing', 'China', 'https://smartdevices.com', 'https://smartdevices.en.alibaba.com', 4.6, 'T/T 50% deposit', ARRAY['DHL', 'EMS'], 1500.00, 12);

-- Insert sample products
INSERT INTO public.products (
  id, name, description, price, compare_at_price, cost_price, sku, brand, weight, dimensions, 
  category_id, category, tags, images, specifications, features, slug, meta_title, meta_description,
  featured, is_active, in_stock, stock_quantity, low_stock_threshold, supplier_id, supplier_sku
) VALUES

-- Smartphones
('750e8400-e29b-41d4-a716-446655440000', 
 'iPhone 15 Pro Max', 
 'The most advanced iPhone ever with titanium design, A17 Pro chip, and Pro camera system.',
 1199.99, 1299.99, 899.99, 'IPH-15PM-128-TIT', 'Apple', 0.221,
 '{"width": 76.7, "height": 159.9, "depth": 8.25, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440001', 'Smartphones',
 ARRAY['iPhone', '5G', 'Titanium', 'Pro Camera', 'A17 Pro'],
 ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDF8fGlwaG9uZSUyMDE1JTIwcHJvfGVufDB8fHx8MTY5NzU0MjQwMHww&ixlib=rb-4.0.3&q=80'],
 '[{"name": "Storage", "value": "128GB"}, {"name": "Display", "value": "6.7-inch Super Retina XDR"}, {"name": "Chip", "value": "A17 Pro"}, {"name": "Camera", "value": "48MP Main + 12MP Ultra Wide + 12MP Telephoto"}, {"name": "Battery", "value": "Up to 29 hours video playback"}, {"name": "5G", "value": "Yes"}]',
 ARRAY['Titanium Design', 'Action Button', 'ProRAW Photography', '4K Video Recording', 'Face ID'],
 'iphone-15-pro-max-128gb-titanium', 'iPhone 15 Pro Max 128GB - LAB404 Electronics', 'Buy the latest iPhone 15 Pro Max with titanium design and A17 Pro chip. Free shipping in Lebanon.',
 true, true, true, 25, 5, '650e8400-e29b-41d4-a716-446655440001', 'APL-IPH15PM-128'),

('750e8400-e29b-41d4-a716-446655440001',
 'Samsung Galaxy S24 Ultra',
 'Ultimate Galaxy experience with S Pen, 200MP camera, and AI-powered features.',
 1099.99, 1199.99, 799.99, 'SAM-S24U-256-TIT', 'Samsung', 0.232,
 '{"width": 79.0, "height": 162.3, "depth": 8.6, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440001', 'Smartphones',
 ARRAY['Samsung', '5G', 'S Pen', '200MP Camera', 'AI Features'],
 ARRAY['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "Storage", "value": "256GB"}, {"name": "Display", "value": "6.8-inch Dynamic AMOLED 2X"}, {"name": "Processor", "value": "Snapdragon 8 Gen 3"}, {"name": "Camera", "value": "200MP Main + 50MP Telephoto + 12MP Ultra Wide + 10MP Telephoto"}, {"name": "S Pen", "value": "Built-in"}, {"name": "5G", "value": "Yes"}]',
 ARRAY['Built-in S Pen', 'Galaxy AI', 'Titanium Frame', '100x Space Zoom', 'All-day Battery'],
 'samsung-galaxy-s24-ultra-256gb', 'Samsung Galaxy S24 Ultra 256GB - LAB404 Electronics', 'Get the Samsung Galaxy S24 Ultra with built-in S Pen and 200MP camera. Best price in Lebanon.',
 true, true, true, 18, 5, '650e8400-e29b-41d4-a716-446655440001', 'SAM-S24U-256'),

-- Laptops
('750e8400-e29b-41d4-a716-446655440002',
 'MacBook Pro 16-inch M3 Max',
 'Supercharged for pros with M3 Max chip, up to 22 hours of battery life, and stunning Liquid Retina XDR display.',
 2999.99, 3199.99, 2299.99, 'MBP-16-M3MAX-36GB', 'Apple', 2.16,
 '{"width": 355.7, "height": 248.1, "depth": 16.8, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440002', 'Laptops',
 ARRAY['MacBook', 'M3 Max', 'Liquid Retina XDR', 'Pro', '16-inch'],
 ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "Chip", "value": "Apple M3 Max"}, {"name": "Memory", "value": "36GB Unified Memory"}, {"name": "Storage", "value": "1TB SSD"}, {"name": "Display", "value": "16.2-inch Liquid Retina XDR"}, {"name": "Battery", "value": "Up to 22 hours"}, {"name": "Ports", "value": "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3"}]',
 ARRAY['M3 Max Performance', 'Liquid Retina XDR Display', '22-hour Battery Life', 'Advanced Thermal Design', 'Six-speaker Sound System'],
 'macbook-pro-16-m3-max-36gb-1tb', 'MacBook Pro 16-inch M3 Max 36GB 1TB - LAB404 Electronics', 'Professional MacBook Pro with M3 Max chip and 36GB memory. Perfect for creative professionals.',
 true, true, true, 8, 3, '650e8400-e29b-41d4-a716-446655440000', 'APL-MBP16-M3MAX'),

('750e8400-e29b-41d4-a716-446655440003',
 'ASUS ROG Strix G16',
 'Powerful gaming laptop with RTX 4070, Intel Core i7, and 165Hz display for ultimate gaming performance.',
 1599.99, 1799.99, 1199.99, 'ASUS-ROG-G16-RTX4070', 'ASUS', 2.5,
 '{"width": 354.9, "height": 259.9, "depth": 23.7, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440002', 'Laptops',
 ARRAY['ASUS', 'ROG', 'Gaming', 'RTX 4070', 'Intel i7'],
 ARRAY['https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=600', 'https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "Processor", "value": "Intel Core i7-13650HX"}, {"name": "Graphics", "value": "NVIDIA GeForce RTX 4070 8GB"}, {"name": "Memory", "value": "16GB DDR5-4800"}, {"name": "Storage", "value": "1TB PCIe 4.0 NVMe SSD"}, {"name": "Display", "value": "16-inch QHD 165Hz"}, {"name": "Keyboard", "value": "RGB Backlit"}]',
 ARRAY['RTX 4070 Graphics', '165Hz QHD Display', 'Advanced Cooling', 'RGB Keyboard', 'Wi-Fi 6E'],
 'asus-rog-strix-g16-rtx4070', 'ASUS ROG Strix G16 Gaming Laptop RTX 4070 - LAB404', 'High-performance gaming laptop with RTX 4070 graphics and 165Hz display. Best gaming experience.',
 true, true, true, 12, 3, '650e8400-e29b-41d4-a716-446655440002', 'ASUS-ROG-G16'),

-- Accessories
('750e8400-e29b-41d4-a716-446655440004',
 'AirPods Pro (3rd generation)',
 'Adaptive Audio, Active Noise Cancellation, and Personalized Spatial Audio for an immersive experience.',
 249.99, 279.99, 179.99, 'APP-3RD-GEN-USB-C', 'Apple', 0.061,
 '{"width": 21.8, "height": 30.9, "depth": 24.0, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440003', 'Accessories',
 ARRAY['AirPods', 'Noise Cancellation', 'Spatial Audio', 'USB-C', 'Wireless'],
 ARRAY['https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600', 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "Chip", "value": "H2"}, {"name": "Battery Life", "value": "Up to 6 hours (30 hours with case)"}, {"name": "Connectivity", "value": "Bluetooth 5.3"}, {"name": "Features", "value": "Adaptive Audio, Active Noise Cancellation"}, {"name": "Charging", "value": "USB-C, Wireless, MagSafe"}, {"name": "Water Resistance", "value": "IPX4"}]',
 ARRAY['Adaptive Audio', 'Active Noise Cancellation', 'Transparency Mode', 'Personalized Spatial Audio', 'Touch Control'],
 'airpods-pro-3rd-generation-usb-c', 'AirPods Pro 3rd Generation USB-C - LAB404 Electronics', 'Latest AirPods Pro with Adaptive Audio and USB-C charging. Premium wireless audio experience.',
 true, true, true, 35, 10, '650e8400-e29b-41d4-a716-446655440000', 'APL-APP3-USBC'),

('750e8400-e29b-41d4-a716-446655440005',
 'Sony WH-1000XM5 Wireless Headphones',
 'Industry-leading noise cancellation with premium sound quality and 30-hour battery life.',
 349.99, 399.99, 249.99, 'SONY-WH1000XM5-BLK', 'Sony', 0.250,
 '{"width": 185, "height": 203, "depth": 76, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440005', 'Audio',
 ARRAY['Sony', 'Wireless', 'Noise Cancellation', 'Premium Audio', 'Long Battery'],
 ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "Driver", "value": "30mm"}, {"name": "Battery Life", "value": "30 hours with ANC"}, {"name": "Charging", "value": "USB-C Quick Charge"}, {"name": "Connectivity", "value": "Bluetooth 5.2, NFC"}, {"name": "Weight", "value": "250g"}, {"name": "Frequency Response", "value": "4Hz-40,000Hz"}]',
 ARRAY['Industry-leading Noise Cancellation', '30-hour Battery Life', 'Premium Sound Quality', 'Quick Charge', 'Multipoint Connection'],
 'sony-wh-1000xm5-wireless-headphones', 'Sony WH-1000XM5 Wireless Noise Canceling Headphones - LAB404', 'Premium Sony headphones with industry-leading noise cancellation and 30-hour battery.',
 false, true, true, 22, 5, '650e8400-e29b-41d4-a716-446655440003', 'SONY-WH1000XM5'),

-- Gaming
('750e8400-e29b-41d4-a716-446655440006',
 'PlayStation 5 Console',
 'Experience lightning-fast loading with an ultra-high speed SSD and immersive gaming with haptic feedback.',
 499.99, 549.99, 399.99, 'SONY-PS5-CONSOLE', 'Sony', 4.5,
 '{"width": 104, "height": 390, "depth": 260, "unit": "mm"}',
 '550e8400-e29b-41d4-a716-446655440004', 'Gaming',
 ARRAY['PlayStation', 'Gaming Console', '4K Gaming', 'SSD', 'Ray Tracing'],
 ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'],
 '[{"name": "CPU", "value": "AMD Zen 2 8-core"}, {"name": "GPU", "value": "AMD Radeon RDNA 2"}, {"name": "Memory", "value": "16GB GDDR6"}, {"name": "Storage", "value": "825GB SSD"}, {"name": "Resolution", "value": "Up to 4K 120fps"}, {"name": "Ray Tracing", "value": "Hardware accelerated"}]',
 ARRAY['Ultra-High Speed SSD', '4K Gaming up to 120fps', 'Ray Tracing', 'Haptic Feedback Controller', '3D Audio'],
 'playstation-5-console', 'Sony PlayStation 5 Console - LAB404 Electronics', 'Latest PlayStation 5 console with ultra-fast SSD and 4K gaming. Available now in Lebanon.',
 true, true, true, 6, 2, '650e8400-e29b-41d4-a716-446655440003', 'SONY-PS5');

-- Insert sample user profiles (Note: These IDs should match actual auth.users entries)
-- In a real setup, these would be created via the trigger when users sign up
-- For testing, you can create these manually after creating auth users

-- Sample analytics data
INSERT INTO public.page_views (id, page_path, referrer, created_at) VALUES
('e50e8400-e29b-41d4-a716-446655440000', '/', 'https://google.com', NOW() - INTERVAL '1 day'),
('e50e8400-e29b-41d4-a716-446655440001', '/store', '/', NOW() - INTERVAL '1 day'),
('e50e8400-e29b-41d4-a716-446655440002', '/store', 'https://facebook.com', NOW() - INTERVAL '2 hours'),
('e50e8400-e29b-41d4-a716-446655440003', '/', 'https://google.com', NOW() - INTERVAL '1 hour');

INSERT INTO public.product_views (id, product_id, view_duration, created_at) VALUES
('f50e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', 120, NOW() - INTERVAL '1 day'),
('f50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 85, NOW() - INTERVAL '1 day'),
('f50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440000', 200, NOW() - INTERVAL '2 hours'),
('f50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440004', 95, NOW() - INTERVAL '1 hour'),
('f50e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440006', 45, NOW() - INTERVAL '30 minutes');
```

---

## Verification Queries

Run these to verify your setup:

```sql
-- Check table creation
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table, trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Check indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify sample data
SELECT 'categories' as table_name, count(*) as record_count FROM public.categories
UNION ALL
SELECT 'suppliers', count(*) FROM public.suppliers
UNION ALL
SELECT 'products', count(*) FROM public.products
UNION ALL
SELECT 'page_views', count(*) FROM public.page_views
UNION ALL
SELECT 'product_views', count(*) FROM public.product_views;

-- Test product search functionality
SELECT id, name, price, rating, review_count
FROM public.products 
WHERE is_active = true 
AND (name ILIKE '%iPhone%' OR description ILIKE '%iPhone%' OR 'iPhone' = ANY(tags))
ORDER BY featured DESC, rating DESC;

-- Test category hierarchy
SELECT 
    c1.name as category,
    c2.name as subcategory,
    COUNT(p.id) as product_count
FROM public.categories c1
LEFT JOIN public.categories c2 ON c2.parent_id = c1.id
LEFT JOIN public.products p ON p.category_id = COALESCE(c2.id, c1.id)
WHERE c1.parent_id IS NULL
GROUP BY c1.id, c1.name, c2.id, c2.name
ORDER BY c1.sort_order, c2.sort_order;
```

---

## 🎉 Setup Complete!

Your LAB404 e-commerce database is now ready! Here's what you have:

### ✅ **Database Features**
- **11 comprehensive tables** with proper relationships
- **Row Level Security** policies for data protection  
- **Performance indexes** for fast queries
- **Automatic triggers** for timestamps and ratings
- **Rich sample data** for testing
- **Full-text search** capabilities
- **Analytics tracking** system

### 📊 **Sample Data Included**
- **6 main categories** + 4 subcategories
- **4 suppliers** with Alibaba integration data
- **7 products** across different categories
- **Analytics data** (page views, product views)

### 🔒 **Security Features**
- **RLS policies** restrict data access by user role
- **Admin-only** access to suppliers and management functions
- **User-specific** cart and wishlist data
- **Guest support** for anonymous shopping

### 🚀 **Ready for Integration**
Your frontend application can now connect to this database using the Supabase client and all the store management features will work with real data!

**Next Steps:**
1. Update your `.env` file with your Supabase URL and anon key
2. Test the connection with your React application
3. Create admin users through Supabase Auth
4. Start using the real database instead of mock data

Happy coding! 🎯