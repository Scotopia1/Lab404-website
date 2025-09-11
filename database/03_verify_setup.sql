-- Verification script to check if database setup is complete
-- Run this script to verify all tables and data are properly created

-- Check if all tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'categories', 'suppliers', 'products', 
    'orders', 'order_items', 'cart_items', 'wishlists', 
    'reviews', 'page_views', 'product_views'
  )
ORDER BY tablename;

-- Check row counts for main tables
SELECT 
  'categories' as table_name, COUNT(*) as row_count 
FROM categories
UNION ALL
SELECT 
  'suppliers' as table_name, COUNT(*) as row_count 
FROM suppliers
UNION ALL
SELECT 
  'products' as table_name, COUNT(*) as row_count 
FROM products
UNION ALL
SELECT 
  'profiles' as table_name, COUNT(*) as row_count 
FROM profiles
UNION ALL
SELECT 
  'reviews' as table_name, COUNT(*) as row_count 
FROM reviews
UNION ALL
SELECT 
  'orders' as table_name, COUNT(*) as row_count 
FROM orders
ORDER BY table_name;

-- Check featured products
SELECT 
  name, 
  price, 
  category, 
  featured,
  rating,
  review_count
FROM products 
WHERE featured = true 
ORDER BY name;

-- Check product categories distribution
SELECT 
  c.name as category_name,
  COUNT(p.id) as product_count,
  c.is_active
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name, c.is_active
ORDER BY product_count DESC;

-- Check user roles
SELECT 
  role,
  COUNT(*) as user_count
FROM profiles
GROUP BY role;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'products', 'orders')
ORDER BY tablename;