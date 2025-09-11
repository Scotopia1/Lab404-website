-- Create products table with comprehensive schema
-- This table will replace the mock data system with real database storage

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  category VARCHAR(100) NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sku VARCHAR(50) UNIQUE,
  brand VARCHAR(100),
  weight DECIMAL(8,2),
  dimensions JSONB,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Create full-text search index for name and description
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE products IS 'Main products table for LAB404 e-commerce platform';
COMMENT ON COLUMN products.id IS 'Unique identifier for each product';
COMMENT ON COLUMN products.name IS 'Product name/title';
COMMENT ON COLUMN products.description IS 'Detailed product description';
COMMENT ON COLUMN products.price IS 'Current selling price';
COMMENT ON COLUMN products.compare_at_price IS 'Original price for comparison (optional)';
COMMENT ON COLUMN products.category IS 'Product category (Electronics, Smartphones, etc.)';
COMMENT ON COLUMN products.images IS 'Array of image URLs stored as JSONB';
COMMENT ON COLUMN products.specifications IS 'Product specifications as key-value pairs';
COMMENT ON COLUMN products.tags IS 'Array of tags for search and categorization';
COMMENT ON COLUMN products.in_stock IS 'Inventory availability status';
COMMENT ON COLUMN products.featured IS 'Whether product is featured on homepage';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.brand IS 'Product brand/manufacturer';
COMMENT ON COLUMN products.rating IS 'Average customer rating (0-5)';
COMMENT ON COLUMN products.review_count IS 'Total number of customer reviews';