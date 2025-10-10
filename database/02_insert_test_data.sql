-- LAB404 E-commerce Test Data
-- Run this script AFTER creating the tables

-- =============================================
-- INSERT CATEGORIES
-- =============================================
INSERT INTO categories (id, name, description, image_url, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Smartphones', 'Mobile phones and accessories', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Laptops', 'Laptops and computing devices', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'Accessories', 'Electronic accessories and cables', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'Audio', 'Headphones, speakers, and audio equipment', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 5, true),
('550e8400-e29b-41d4-a716-446655440006', 'Gaming', 'Gaming consoles and accessories', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500', 6, true),
('550e8400-e29b-41d4-a716-446655440007', 'Smart Home', 'IoT devices and smart home products', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500', 7, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT SUPPLIERS
-- =============================================
INSERT INTO suppliers (id, name, contact_person, email, phone, city, country, website, rating, payment_terms, shipping_methods, minimum_order, lead_time_days) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'TechnoGlobal Ltd', 'Zhang Wei', 'sales@technoglobal.com', '+86-138-0013-8000', 'Shenzhen', 'China', 'www.technoglobal.com', 4.5, '30% deposit, 70% before shipping', ARRAY['DHL', 'FedEx', 'Sea Freight'], 1000, 15),
('660e8400-e29b-41d4-a716-446655440002', 'ElectroMart Industries', 'Li Ming', 'info@electromart.cn', '+86-139-0013-8001', 'Guangzhou', 'China', 'www.electromart.cn', 4.2, 'T/T, PayPal', ARRAY['UPS', 'DHL'], 500, 10),
('660e8400-e29b-41d4-a716-446655440003', 'Digital Solutions Co', 'Wang Lei', 'orders@digitalsolutions.com', '+86-137-0013-8002', 'Beijing', 'China', 'www.digitalsolutions.com', 4.8, 'L/C, T/T', ARRAY['FedEx', 'TNT', 'Sea Freight'], 2000, 20),
('660e8400-e29b-41d4-a716-446655440004', 'SmartTech Manufacturing', 'Chen Hua', 'sales@smarttech-mfg.com', '+86-136-0013-8003', 'Dongguan', 'China', 'www.smarttech-mfg.com', 4.0, 'Western Union, T/T', ARRAY['DHL', 'EMS'], 800, 12)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT PROFILES (Test Users)
-- =============================================
INSERT INTO profiles (id, email, name, role, phone, city, country) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'admin@lab404.com', 'Lab404 Admin', 'admin', '+961-70-123456', 'Beirut', 'Lebanon'),
('770e8400-e29b-41d4-a716-446655440002', 'john.doe@email.com', 'John Doe', 'user', '+961-71-987654', 'Tripoli', 'Lebanon'),
('770e8400-e29b-41d4-a716-446655440003', 'sara.smith@email.com', 'Sara Smith', 'user', '+961-76-555123', 'Sidon', 'Lebanon'),
('770e8400-e29b-41d4-a716-446655440004', 'mike.johnson@email.com', 'Mike Johnson', 'user', '+961-3-444789', 'Zahle', 'Lebanon')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT PRODUCTS
-- =============================================
INSERT INTO products (
  id, name, description, price, compare_at_price, sku, brand, category_id, category, 
  tags, images, in_stock, stock_quantity, featured, specifications, features, rating, review_count, supplier_id
) VALUES
-- Smartphones
('880e8400-e29b-41d4-a716-446655440001', 
 'iPhone 15 Pro Max', 
 'The latest iPhone with titanium design, A17 Pro chip, and advanced camera system', 
 1299.99, 1399.99, 'APPLE-IP15PM-256', 'Apple',
 '550e8400-e29b-41d4-a716-446655440002', 'Smartphones',
 ARRAY['smartphone', 'ios', 'premium', 'camera', '5g'],
 ARRAY[
   'https://images.unsplash.com/photo-1592286036801-eba8e7498bb4?w=500',
   'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500'
 ],
 true, 25, true,
 '{"display": "6.7-inch Super Retina XDR", "storage": "256GB", "camera": "48MP Main", "battery": "4422mAh"}'::jsonb,
 ARRAY['Face ID', 'Wireless Charging', 'Water Resistant', 'A17 Pro Chip'],
 4.8, 324, '660e8400-e29b-41d4-a716-446655440001'),

('880e8400-e29b-41d4-a716-446655440002',
 'Samsung Galaxy S24 Ultra',
 'Premium Android smartphone with S Pen, 200MP camera, and AI features',
 1199.99, 1299.99, 'SAMSUNG-S24U-512', 'Samsung',
 '550e8400-e29b-41d4-a716-446655440002', 'Smartphones',
 ARRAY['smartphone', 'android', 'premium', 's-pen', '5g'],
 ARRAY[
   'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
   'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500'
 ],
 true, 18, true,
 '{"display": "6.8-inch Dynamic AMOLED 2X", "storage": "512GB", "camera": "200MP Main", "battery": "5000mAh"}'::jsonb,
 ARRAY['S Pen', 'Wireless Charging', 'Water Resistant', 'AI Camera'],
 4.7, 256, '660e8400-e29b-41d4-a716-446655440002'),

-- Laptops
('880e8400-e29b-41d4-a716-446655440003',
 'MacBook Pro 16-inch M3',
 'Professional laptop with M3 chip, Liquid Retina XDR display, and all-day battery life',
 2499.99, 2699.99, 'APPLE-MBP16-M3', 'Apple',
 '550e8400-e29b-41d4-a716-446655440003', 'Laptops',
 ARRAY['laptop', 'macbook', 'professional', 'm3', 'creative'],
 ARRAY[
   'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
   'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'
 ],
 true, 12, true,
 '{"display": "16.2-inch Liquid Retina XDR", "processor": "M3 Pro", "memory": "18GB", "storage": "512GB SSD"}'::jsonb,
 ARRAY['Touch ID', 'Force Touch trackpad', 'Backlit Keyboard', 'Thunderbolt 4'],
 4.9, 189, '660e8400-e29b-41d4-a716-446655440001'),

('880e8400-e29b-41d4-a716-446655440004',
 'Dell XPS 13 Plus',
 'Ultra-thin laptop with 12th Gen Intel processor and InfinityEdge display',
 1399.99, 1599.99, 'DELL-XPS13P-I7', 'Dell',
 '550e8400-e29b-41d4-a716-446655440003', 'Laptops',
 ARRAY['laptop', 'ultrabook', 'business', 'portable', 'intel'],
 ARRAY[
   'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500',
   'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500'
 ],
 true, 8, false,
 '{"display": "13.4-inch 3.5K OLED", "processor": "Intel i7-1260P", "memory": "16GB", "storage": "512GB SSD"}'::jsonb,
 ARRAY['Fingerprint Reader', 'Backlit Keyboard', 'Wi-Fi 6E', 'USB-C Thunderbolt 4'],
 4.5, 127, '660e8400-e29b-41d4-a716-446655440003'),

-- Audio Equipment
('880e8400-e29b-41d4-a716-446655440005',
 'Sony WH-1000XM5 Headphones',
 'Industry-leading noise canceling wireless headphones with 30-hour battery life',
 399.99, 449.99, 'SONY-WH1000XM5-BK', 'Sony',
 '550e8400-e29b-41d4-a716-446655440005', 'Audio',
 ARRAY['headphones', 'wireless', 'noise-canceling', 'premium'],
 ARRAY[
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
   'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'
 ],
 true, 45, true,
 '{"driver": "30mm", "battery": "30 hours", "connectivity": "Bluetooth 5.2", "weight": "250g"}'::jsonb,
 ARRAY['Active Noise Canceling', 'Touch Controls', 'Quick Charge', 'Multipoint Connection'],
 4.6, 892, '660e8400-e29b-41d4-a716-446655440004'),

-- Gaming
('880e8400-e29b-41d4-a716-446655440006',
 'PlayStation 5 Console',
 'Next-gen gaming console with ultra-fast SSD and ray tracing support',
 499.99, 549.99, 'SONY-PS5-STD', 'Sony',
 '550e8400-e29b-41d4-a716-446655440006', 'Gaming',
 ARRAY['gaming', 'console', 'playstation', 'next-gen'],
 ARRAY[
   'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500',
   'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500'
 ],
 true, 15, true,
 '{"cpu": "AMD Zen 2", "gpu": "RDNA 2", "storage": "825GB SSD", "memory": "16GB GDDR6"}'::jsonb,
 ARRAY['4K Gaming', 'Ray Tracing', '3D Audio', 'Ultra-fast SSD'],
 4.8, 1203, '660e8400-e29b-41d4-a716-446655440002'),

-- Accessories
('880e8400-e29b-41d4-a716-446655440007',
 'Anker PowerCore 10000 Power Bank',
 'Compact portable charger with high-speed charging technology',
 29.99, 39.99, 'ANKER-PC10K-BK', 'Anker',
 '550e8400-e29b-41d4-a716-446655440004', 'Accessories',
 ARRAY['power-bank', 'portable', 'charging', 'travel'],
 ARRAY[
   'https://images.unsplash.com/photo-1609592869971-4e987b3ea0c5?w=500',
   'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500'
 ],
 true, 120, false,
 '{"capacity": "10000mAh", "output": "12W", "ports": "USB-A & USB-C", "weight": "180g"}'::jsonb,
 ARRAY['Fast Charging', 'Compact Design', 'LED Indicator', 'Multi-device'],
 4.4, 567, '660e8400-e29b-41d4-a716-446655440004'),

-- Smart Home
('880e8400-e29b-41d4-a716-446655440008',
 'Amazon Echo Dot (5th Gen)',
 'Smart speaker with Alexa voice control and improved sound quality',
 49.99, 59.99, 'AMAZON-ECHO5-CL', 'Amazon',
 '550e8400-e29b-41d4-a716-446655440007', 'Smart Home',
 ARRAY['smart-speaker', 'alexa', 'voice-control', 'iot'],
 ARRAY[
   'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'
 ],
 true, 85, false,
 '{"speaker": "1.73-inch driver", "connectivity": "Wi-Fi 6", "control": "Voice + Touch", "size": "100mm"}'::jsonb,
 ARRAY['Voice Control', 'Smart Home Hub', 'Music Streaming', 'Drop-in Calling'],
 4.3, 1456, '660e8400-e29b-41d4-a716-446655440003')

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT REVIEWS
-- =============================================
INSERT INTO reviews (id, product_id, user_id, rating, title, comment, verified_purchase, is_approved) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 5, 'Amazing phone!', 'The iPhone 15 Pro Max exceeded my expectations. Camera quality is outstanding!', true, true),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 4, 'Great but expensive', 'Love the features but quite pricey. Worth it for the camera alone.', true, true),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004', 5, 'Perfect for work', 'MacBook Pro handles everything I throw at it. Best laptop I have owned.', true, true),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 5, 'Excellent noise canceling', 'These headphones are incredible for travel and work. Highly recommended!', true, true),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', 4, 'Gaming is amazing', 'PS5 delivers incredible gaming experience. Some games still hard to find.', true, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT SAMPLE ORDERS
-- =============================================
INSERT INTO orders (id, user_id, status, payment_status, subtotal, tax_amount, shipping_amount, total_amount, shipping_address, whatsapp_number) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440002', 
 'delivered', 'paid', 1299.99, 129.99, 25.00, 1454.98,
 '{"name": "John Doe", "address": "123 Main St", "city": "Tripoli", "country": "Lebanon", "phone": "+961-71-987654"}'::jsonb,
 '+961-71-987654'),

('aa0e8400-e29b-41d4-a716-446655440002',
 '770e8400-e29b-41d4-a716-446655440003',
 'shipped', 'paid', 399.99, 40.00, 15.00, 454.99,
 '{"name": "Sara Smith", "address": "456 Oak Ave", "city": "Sidon", "country": "Lebanon", "phone": "+961-76-555123"}'::jsonb,
 '+961-76-555123')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INSERT ORDER ITEMS
-- =============================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 1, 1299.99, 1299.99,
 '{"name": "iPhone 15 Pro Max", "sku": "APPLE-IP15PM-256", "price": 1299.99}'::jsonb),

('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', 1, 399.99, 399.99,
 '{"name": "Sony WH-1000XM5 Headphones", "sku": "SONY-WH1000XM5-BK", "price": 399.99}'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================
-- INSERT SAMPLE CART ITEMS
-- =============================================
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
('770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', 1),
('770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440007', 2)
ON CONFLICT DO NOTHING;

-- =============================================
-- INSERT SAMPLE WISHLIST ITEMS
-- =============================================
INSERT INTO wishlists (user_id, product_id) VALUES
('770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003'),
('770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440006'),
('770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;

-- Update product ratings based on reviews
UPDATE products SET 
  rating = (
    SELECT ROUND(AVG(rating::numeric), 2) 
    FROM reviews 
    WHERE reviews.product_id = products.id AND reviews.is_approved = true
  ),
  review_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE reviews.product_id = products.id AND reviews.is_approved = true
  )
WHERE id IN (
  SELECT DISTINCT product_id FROM reviews WHERE is_approved = true
);

-- Generate some sample slugs for products
UPDATE products SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')) WHERE slug IS NULL;