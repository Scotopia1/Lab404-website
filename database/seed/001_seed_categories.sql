-- Seed categories data
INSERT INTO categories (name, slug, description, image_url, sort_order, active) VALUES
('Electronics', 'electronics', 'Electronic devices and components', null, 1, true),
('Smartphones', 'smartphones', 'Mobile phones and accessories', null, 2, true),
('Laptops', 'laptops', 'Laptops and computer accessories', null, 3, true),
('Accessories', 'accessories', 'Electronic accessories and peripherals', null, 4, true),
('Audio', 'audio', 'Audio equipment and sound systems', null, 5, true),
('Gaming', 'gaming', 'Gaming consoles and accessories', null, 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();