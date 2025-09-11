-- Seed suppliers data
INSERT INTO suppliers (alibaba_id, name, rating, location, contact_info, certifications, response_rate, on_time_delivery, minimum_order, payment_terms, active) VALUES
('SUP001', 'TechSource Electronics Co.', 4.8, 'Shenzhen, China', '{"email": "contact@techsource.com", "phone": "+86-755-1234567", "website": "www.techsource.com"}', '{"ISO9001", "CE", "RoHS"}', 95.5, 92.3, 50, 'T/T, L/C', true),
('SUP002', 'MobileMax Trading Ltd.', 4.6, 'Guangzhou, China', '{"email": "sales@mobilemax.com", "phone": "+86-20-8765432", "website": "www.mobilemax.com"}', '{"CE", "FCC", "RoHS"}', 88.2, 89.7, 25, 'T/T, PayPal', true),
('SUP003', 'EliteTech Components', 4.9, 'Dongguan, China', '{"email": "info@elitetech.com", "phone": "+86-769-9876543", "website": "www.elitetech.com"}', '{"ISO9001", "CE", "FCC", "RoHS"}', 98.1, 95.4, 100, 'T/T, L/C, Western Union', true),
('SUP004', 'GadgetHub International', 4.4, 'Yiwu, China', '{"email": "export@gadgethub.com", "phone": "+86-579-5551234", "website": "www.gadgethub.com"}', '{"CE", "RoHS"}', 82.7, 87.1, 20, 'T/T, PayPal, Alibaba Trade Assurance', true)
ON CONFLICT (alibaba_id) DO UPDATE SET
  name = EXCLUDED.name,
  rating = EXCLUDED.rating,
  location = EXCLUDED.location,
  contact_info = EXCLUDED.contact_info,
  certifications = EXCLUDED.certifications,
  response_rate = EXCLUDED.response_rate,
  on_time_delivery = EXCLUDED.on_time_delivery,
  updated_at = NOW();