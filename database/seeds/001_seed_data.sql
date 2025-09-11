-- LAB404 E-commerce Platform Seed Data
-- Test data for development and testing purposes

-- =============================================
-- CATEGORIES
-- =============================================

INSERT INTO public.categories (id, name, description, image_url, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Electronics', 'Electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', 1, true),
('550e8400-e29b-41d4-a716-446655440001', 'Smartphones', 'Mobile phones and accessories', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 2, true),
('550e8400-e29b-41d4-a716-446655440002', 'Laptops', 'Laptops and notebook computers', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 3, true),
('550e8400-e29b-41d4-a716-446655440003', 'Accessories', 'Electronic accessories and peripherals', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400', 4, true),
('550e8400-e29b-41d4-a716-446655440004', 'Gaming', 'Gaming devices and accessories', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400', 5, true),
('550e8400-e29b-41d4-a716-446655440005', 'Audio', 'Headphones, speakers and audio equipment', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 6, true);

-- Subcategories
INSERT INTO public.categories (id, name, description, parent_id, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'iPhone', 'Apple iPhones', '550e8400-e29b-41d4-a716-446655440001', 1, true),
('550e8400-e29b-41d4-a716-446655440011', 'Samsung Galaxy', 'Samsung Galaxy series', '550e8400-e29b-41d4-a716-446655440001', 2, true),
('550e8400-e29b-41d4-a716-446655440012', 'Gaming Laptops', 'High-performance gaming laptops', '550e8400-e29b-41d4-a716-446655440002', 1, true),
('550e8400-e29b-41d4-a716-446655440013', 'Business Laptops', 'Professional business laptops', '550e8400-e29b-41d4-a716-446655440002', 2, true);

-- =============================================
-- SUPPLIERS
-- =============================================

INSERT INTO public.suppliers (id, name, contact_person, email, phone, address, city, country, website, alibaba_profile, rating, payment_terms, shipping_methods, minimum_order, lead_time_days) VALUES
('650e8400-e29b-41d4-a716-446655440000', 'TechSource Electronics', 'John Chen', 'john@techsource.com', '+86-138-0013-8000', '123 Tech Street', 'Shenzhen', 'China', 'https://techsource.com', 'https://techsource.en.alibaba.com', 4.5, 'T/T 30% deposit, 70% before shipment', ARRAY['DHL', 'FedEx', 'Sea Freight'], 1000.00, 15),
('650e8400-e29b-41d4-a716-446655440001', 'Global Electronics Co.', 'Lisa Wang', 'lisa@globalelec.com', '+86-138-0013-8001', '456 Electronics Ave', 'Guangzhou', 'China', 'https://globalelec.com', 'https://globalelec.en.alibaba.com', 4.8, 'L/C at sight', ARRAY['DHL', 'UPS', 'Air Freight'], 2000.00, 10),
('650e8400-e29b-41d4-a716-446655440002', 'Premium Tech Solutions', 'David Liu', 'david@premiumtech.com', '+86-138-0013-8002', '789 Innovation Blvd', 'Shanghai', 'China', 'https://premiumtech.com', 'https://premiumtech.en.alibaba.com', 4.3, 'Western Union, PayPal', ARRAY['FedEx', 'TNT'], 500.00, 20),
('650e8400-e29b-41d4-a716-446655440003', 'Smart Devices Inc.', 'Sarah Zhang', 'sarah@smartdevices.com', '+86-138-0013-8003', '321 Smart Plaza', 'Beijing', 'China', 'https://smartdevices.com', 'https://smartdevices.en.alibaba.com', 4.6, 'T/T 50% deposit', ARRAY['DHL', 'EMS'], 1500.00, 12);

-- =============================================
-- PRODUCTS
-- =============================================

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

-- =============================================
-- SAMPLE USER PROFILES (for testing)
-- =============================================

-- Note: These would normally be created through auth.users, but for testing purposes
-- we'll create sample profiles that can be linked to auth users later

INSERT INTO public.profiles (id, email, name, role, phone, address, city, country) VALUES
('850e8400-e29b-41d4-a716-446655440000', 'admin@lab404.com', 'Admin User', 'admin', '+961-76-666-341', 'LAB404 HQ', 'Beirut', 'Lebanon'),
('850e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe', 'user', '+961-70-123-456', '123 Main St', 'Beirut', 'Lebanon'),
('850e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith', 'user', '+961-71-987-654', '456 Oak Ave', 'Tripoli', 'Lebanon');

-- =============================================
-- SAMPLE REVIEWS
-- =============================================

INSERT INTO public.reviews (id, product_id, user_id, rating, title, comment, verified_purchase, is_approved) VALUES
('950e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', 5, 'Amazing Phone!', 'The iPhone 15 Pro Max exceeded my expectations. The titanium design feels premium and the camera quality is outstanding. Highly recommended!', true, true),
('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440002', 4, 'Great but expensive', 'Excellent phone with amazing features, but quite pricey. The Action Button is a nice touch and the performance is top-notch.', true, true),
('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 5, 'Love the S Pen!', 'The Galaxy S24 Ultra with built-in S Pen is perfect for productivity. The 200MP camera takes incredible photos and the AI features are impressive.', true, true),
('950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 5, 'Best AirPods yet', 'The adaptive audio feature is game-changing. They automatically adjust to your environment perfectly. Worth every penny!', true, true),
('950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440001', 4, 'Excellent noise cancellation', 'Sony really nailed the noise cancellation. Perfect for long flights and commuting. Battery life is as advertised.', true, true);

-- =============================================
-- SAMPLE CART ITEMS (for testing user cart functionality)
-- =============================================

INSERT INTO public.cart_items (id, user_id, product_id, quantity) VALUES
('a50e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', 1),
('a50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005', 1),
('a50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440000', 1);

-- =============================================
-- SAMPLE WISHLIST ITEMS
-- =============================================

INSERT INTO public.wishlists (id, user_id, product_id) VALUES
('b50e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002'),
('b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440006'),
('b50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003');

-- =============================================
-- SAMPLE ORDER (for testing order functionality)
-- =============================================

INSERT INTO public.orders (
  id, user_id, status, payment_status, subtotal, tax_amount, shipping_amount, total_amount, 
  currency, whatsapp_number, shipping_address, billing_address
) VALUES (
  'c50e8400-e29b-41d4-a716-446655440000',
  '850e8400-e29b-41d4-a716-446655440001',
  'confirmed',
  'paid',
  599.98,
  59.98,
  15.00,
  674.96,
  'USD',
  '+961-70-123-456',
  '{"name": "John Doe", "address": "123 Main St", "city": "Beirut", "country": "Lebanon", "phone": "+961-70-123-456"}',
  '{"name": "John Doe", "address": "123 Main St", "city": "Beirut", "country": "Lebanon", "phone": "+961-70-123-456"}'
);

INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES
('d50e8400-e29b-41d4-a716-446655440000', 
 'c50e8400-e29b-41d4-a716-446655440000',
 '750e8400-e29b-41d4-a716-446655440004',
 1,
 249.99,
 249.99,
 '{"id": "750e8400-e29b-41d4-a716-446655440004", "name": "AirPods Pro (3rd generation)", "price": 249.99, "image": "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600"}'),
('d50e8400-e29b-41d4-a716-446655440001',
 'c50e8400-e29b-41d4-a716-446655440000',
 '750e8400-e29b-41d4-a716-446655440005',
 1,
 349.99,
 349.99,
 '{"id": "750e8400-e29b-41d4-a716-446655440005", "name": "Sony WH-1000XM5 Wireless Headphones", "price": 349.99, "image": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600"}');

-- =============================================
-- ANALYTICS SAMPLE DATA
-- =============================================

-- Sample page views
INSERT INTO public.page_views (id, user_id, page_path, referrer, created_at) VALUES
('e50e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', '/', 'https://google.com', NOW() - INTERVAL '1 day'),
('e50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '/store', '/', NOW() - INTERVAL '1 day'),
('e50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '/store', 'https://facebook.com', NOW() - INTERVAL '2 hours'),
('e50e8400-e29b-41d4-a716-446655440003', NULL, '/', 'https://google.com', NOW() - INTERVAL '1 hour');

-- Sample product views
INSERT INTO public.product_views (id, product_id, user_id, view_duration, created_at) VALUES
('f50e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', 120, NOW() - INTERVAL '1 day'),
('f50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 85, NOW() - INTERVAL '1 day'),
('f50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440002', 200, NOW() - INTERVAL '2 hours'),
('f50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440001', 95, NOW() - INTERVAL '1 hour'),
('f50e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440006', NULL, 45, NOW() - INTERVAL '30 minutes');

-- =============================================
-- UPDATE SEQUENCES (if needed)
-- =============================================

-- Update product rating and review counts based on reviews
UPDATE public.products SET 
  rating = subquery.avg_rating,
  review_count = subquery.review_count
FROM (
  SELECT 
    product_id,
    ROUND(AVG(rating::numeric), 1) as avg_rating,
    COUNT(*) as review_count
  FROM public.reviews 
  WHERE is_approved = true 
  GROUP BY product_id
) AS subquery
WHERE products.id = subquery.product_id;

-- Add some additional test data comments
COMMENT ON TABLE public.categories IS 'Product categories with hierarchical support';
COMMENT ON TABLE public.products IS 'Main products table with comprehensive e-commerce features';
COMMENT ON TABLE public.suppliers IS 'Supplier information for Alibaba integration';
COMMENT ON TABLE public.reviews IS 'Product reviews with approval workflow';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '📊 Categories: 10 (6 main + 4 subcategories)';
  RAISE NOTICE '🏪 Suppliers: 4';
  RAISE NOTICE '📱 Products: 7 (across different categories)';
  RAISE NOTICE '👥 Sample Users: 3 (1 admin + 2 regular users)';
  RAISE NOTICE '⭐ Reviews: 5';
  RAISE NOTICE '🛒 Cart Items: 3';
  RAISE NOTICE '❤️ Wishlist Items: 3';
  RAISE NOTICE '📦 Sample Order: 1 (with 2 items)';
  RAISE NOTICE '📈 Analytics: 8 page views + 5 product views';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Database is ready for testing and development!';
END $$;