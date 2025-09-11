-- Create categories table for better category management
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to products table
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category) REFERENCES categories(slug) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add comments
COMMENT ON TABLE categories IS 'Product categories with hierarchical support';
COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for hierarchical structure';
COMMENT ON COLUMN categories.sort_order IS 'Display order for category listing';