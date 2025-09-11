-- Create suppliers table for Alibaba integration
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alibaba_id VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  location VARCHAR(255),
  contact_info JSONB DEFAULT '{}'::jsonb,
  certifications TEXT[] DEFAULT '{}',
  response_rate DECIMAL(5,2) DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  on_time_delivery DECIMAL(5,2) DEFAULT 0 CHECK (on_time_delivery >= 0 AND on_time_delivery <= 100),
  minimum_order INTEGER DEFAULT 1,
  payment_terms TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_alibaba_id ON suppliers(alibaba_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);

-- Create trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add supplier_id to products table
ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Add comments
COMMENT ON TABLE suppliers IS 'Supplier information for product sourcing and Alibaba integration';
COMMENT ON COLUMN suppliers.alibaba_id IS 'Alibaba supplier ID for API integration';
COMMENT ON COLUMN suppliers.response_rate IS 'Supplier response rate percentage';
COMMENT ON COLUMN suppliers.on_time_delivery IS 'On-time delivery rate percentage';