-- LAB404 Database Setup Script
-- Run this script in Supabase SQL Editor to set up the complete database schema

\echo 'Setting up LAB404 database schema...'

-- Run migrations in order
\i migrations/001_create_products_table.sql
\i migrations/002_create_categories_table.sql
\i migrations/003_create_suppliers_table.sql
\i migrations/004_create_users_profiles.sql

\echo 'Database schema created successfully.'

-- Run seed data
\echo 'Seeding initial data...'

\i seed/001_seed_categories.sql
\i seed/002_seed_suppliers.sql
\i seed/003_seed_products.sql

\echo 'Database setup completed successfully!'
\echo 'You can now use the LAB404 e-commerce platform with real database integration.'