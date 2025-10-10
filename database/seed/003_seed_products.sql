-- Seed products data with suppliers
INSERT INTO products (
  name, description, price, compare_at_price, category, images, specifications, 
  tags, in_stock, featured, sku, brand, weight, dimensions, rating, review_count, 
  supplier_id
) VALUES
-- Smartphones
(
  'iPhone 15 Pro Max', 
  'Latest iPhone with advanced camera system and A17 Pro chip', 
  1299.99, 1399.99, 'smartphones',
  '["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"]',
  '[{"name": "Display", "value": "6.7-inch Super Retina XDR"}, {"name": "Chip", "value": "A17 Pro"}, {"name": "Storage", "value": "256GB"}, {"name": "Camera", "value": "48MP Main + 12MP Ultra Wide + 12MP Telephoto"}]',
  '{"smartphone", "iPhone", "Apple", "5G", "premium"}',
  true, true, 'IPH15PM256', 'Apple', 221.0,
  '{"width": 77.6, "height": 159.9, "depth": 8.25}',
  4.8, 1247,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP002')
),
(
  'Samsung Galaxy S24 Ultra',
  'Premium Android smartphone with S Pen and advanced AI features',
  1199.99, 1299.99, 'smartphones',
  '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500", "https://images.unsplash.com/photo-1596558450255-7c0b7be9d56a?w=500"]',
  '[{"name": "Display", "value": "6.8-inch Dynamic AMOLED 2X"}, {"name": "Processor", "value": "Snapdragon 8 Gen 3"}, {"name": "Storage", "value": "512GB"}, {"name": "Camera", "value": "200MP Main + 50MP Periscope Telephoto"}]',
  '{"smartphone", "Samsung", "Galaxy", "S Pen", "Android", "premium"}',
  true, true, 'SGS24U512', 'Samsung', 232.0,
  '{"width": 79.0, "height": 162.3, "depth": 8.6}',
  4.7, 892,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP002')
),

-- Laptops
(
  'MacBook Pro 16-inch M3 Pro',
  'Professional laptop with M3 Pro chip for demanding workflows',
  2499.99, 2699.99, 'laptops',
  '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"]',
  '[{"name": "Display", "value": "16.2-inch Liquid Retina XDR"}, {"name": "Chip", "value": "Apple M3 Pro"}, {"name": "Memory", "value": "18GB Unified Memory"}, {"name": "Storage", "value": "512GB SSD"}]',
  '{"laptop", "MacBook", "Apple", "M3", "professional", "creative"}',
  true, true, 'MBP16M3P512', 'Apple', 2150.0,
  '{"width": 355.7, "height": 248.1, "depth": 16.8}',
  4.9, 654,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP001')
),
(
  'Dell XPS 15 OLED',
  'Premium Windows laptop with stunning OLED display',
  1899.99, 2199.99, 'laptops',
  '["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500"]',
  '[{"name": "Display", "value": "15.6-inch OLED 4K"}, {"name": "Processor", "value": "Intel Core i7-13700H"}, {"name": "Memory", "value": "32GB DDR5"}, {"name": "Storage", "value": "1TB SSD"}]',
  '{"laptop", "Dell", "XPS", "OLED", "4K", "Windows", "premium"}',
  true, true, 'DXPS15OLED', 'Dell', 1860.0,
  '{"width": 344.7, "height": 230.14, "depth": 18}',
  4.6, 423,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP001')
),

-- Electronics
(
  'Sony WH-1000XM5 Headphones',
  'Industry-leading noise canceling wireless headphones',
  399.99, 449.99, 'electronics',
  '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500"]',
  '[{"name": "Driver", "value": "30mm"}, {"name": "Frequency Response", "value": "4Hz-40kHz"}, {"name": "Battery Life", "value": "30 hours"}, {"name": "Connectivity", "value": "Bluetooth 5.2, NFC"}]',
  '{"headphones", "Sony", "wireless", "noise-canceling", "premium"}',
  true, false, 'SYWH1000XM5', 'Sony', 250.0,
  '{"width": 170, "height": 70, "depth": 200}',
  4.5, 2341,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP003')
),
(
  'iPad Air 5th Generation',
  'Powerful tablet with M1 chip and stunning Liquid Retina display',
  599.99, 649.99, 'electronics',
  '["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500", "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=500"]',
  '[{"name": "Display", "value": "10.9-inch Liquid Retina"}, {"name": "Chip", "value": "Apple M1"}, {"name": "Storage", "value": "256GB"}, {"name": "Camera", "value": "12MP Wide + 12MP Ultra Wide Front"}]',
  '{"tablet", "iPad", "Apple", "M1", "creative", "portable"}',
  true, true, 'IPADAIR5256', 'Apple', 461.0,
  '{"width": 178.5, "height": 247.6, "depth": 6.1}',
  4.7, 1876,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP002')
),

-- Accessories
(
  'Anker PowerCore 26800 Power Bank',
  'High-capacity portable charger with fast charging technology',
  79.99, 99.99, 'accessories',
  '["https://images.unsplash.com/photo-1609592156001-67a7a2b87e77?w=500"]',
  '[{"name": "Capacity", "value": "26800mAh"}, {"name": "Input", "value": "USB-C PD 30W"}, {"name": "Output", "value": "3 USB ports"}, {"name": "Charging Technology", "value": "PowerIQ 2.0"}]',
  '{"power-bank", "Anker", "portable", "charging", "high-capacity"}',
  true, false, 'ANK26800PB', 'Anker', 495.0,
  '{"width": 80, "height": 158, "depth": 22}',
  4.4, 5432,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP004')
),
(
  'Logitech MX Master 3S Wireless Mouse',
  'Advanced wireless mouse with precision scrolling and ergonomic design',
  99.99, 119.99, 'accessories',
  '["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500"]',
  '[{"name": "Sensor", "value": "Darkfield 8000 DPI"}, {"name": "Battery Life", "value": "70 days"}, {"name": "Connectivity", "value": "Bluetooth, USB Receiver"}, {"name": "Buttons", "value": "7 buttons"}]',
  '{"mouse", "Logitech", "wireless", "ergonomic", "productivity"}',
  true, false, 'LGMXM3S', 'Logitech', 141.0,
  '{"width": 84.3, "height": 51, "depth": 124.9}',
  4.6, 1234,
  (SELECT id FROM suppliers WHERE alibaba_id = 'SUP004')
);

-- Update product categories to match existing categories
UPDATE products SET category = 'smartphones' WHERE category = 'Smartphones';
UPDATE products SET category = 'laptops' WHERE category = 'Laptops';
UPDATE products SET category = 'electronics' WHERE category = 'Electronics';
UPDATE products SET category = 'accessories' WHERE category = 'Accessories';