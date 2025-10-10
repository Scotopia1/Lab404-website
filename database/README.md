# Database Setup Instructions

This directory contains SQL scripts to set up your LAB404 e-commerce database in Supabase.

## Files

1. **`01_create_tables.sql`** - Creates all database tables, indexes, triggers, and RLS policies
2. **`02_insert_test_data.sql`** - Inserts comprehensive test data for development and testing

## Setup Instructions

### Step 1: Run the Schema Creation Script

1. Open your Supabase project dashboard
2. Go to the **SQL Editor** 
3. Copy and paste the contents of `01_create_tables.sql`
4. Click **Run** to create all tables and setup

### Step 2: Insert Test Data

1. In the same SQL Editor
2. Copy and paste the contents of `02_insert_test_data.sql` 
3. Click **Run** to populate the database with test data

## Database Schema Overview

### Core Tables

- **`profiles`** - User profiles and authentication data
- **`categories`** - Product categories (Electronics, Smartphones, etc.)
- **`suppliers`** - Supplier information for products
- **`products`** - Main product catalog
- **`orders`** - Customer orders
- **`order_items`** - Items within each order
- **`cart_items`** - Shopping cart contents
- **`wishlists`** - User wishlist items
- **`reviews`** - Product reviews and ratings

### Analytics Tables

- **`page_views`** - Website analytics
- **`product_views`** - Product view tracking

## Test Data Included

### Categories (7 categories)
- Electronics, Smartphones, Laptops, Accessories, Audio, Gaming, Smart Home

### Suppliers (4 suppliers)
- Chinese manufacturers with realistic contact information

### Products (8 featured products)
- iPhone 15 Pro Max
- Samsung Galaxy S24 Ultra  
- MacBook Pro 16-inch M3
- Dell XPS 13 Plus
- Sony WH-1000XM5 Headphones
- PlayStation 5 Console
- Anker PowerCore 10000
- Amazon Echo Dot (5th Gen)

### Users (4 test users)
- Admin user: `admin@lab404.com`
- Regular users with Lebanese phone numbers and addresses

### Sample Data
- Product reviews and ratings
- Sample orders (delivered and shipped)
- Cart items and wishlist entries

## Features Enabled

- **Row Level Security (RLS)** - Database security policies
- **Automatic Timestamps** - `created_at` and `updated_at` triggers
- **Performance Indexes** - Optimized for common queries
- **Data Validation** - Constraints and checks
- **Foreign Key Relationships** - Data integrity

## Environment Variables

Make sure your `.env.local` file has the correct database URL:

```env
VITE_DATABASE_URL=postgresql://postgres:Sc%40topia81898056@db.ndzypstmjawxouxazkkv.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://ndzypstmjawxouxazkkv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kenlwc3RtamF3eG91eGF6a2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzMyODksImV4cCI6MjA3Mjc0OTI4OX0.UQjeTA-BrxD7K-KLY9fJM3SllfMzSmOnkGJU_FOfv1c
```

## Testing the Database

After running both scripts, you can test the database connection by:

1. Starting your development server: `npm run dev`
2. Opening the application in your browser
3. Navigating through products, categories, etc.
4. The application should now display real data from the database

## Troubleshooting

If you encounter any issues:

1. **Permission Errors**: Make sure RLS policies are properly set
2. **Connection Errors**: Verify your environment variables
3. **Data Issues**: Check that both SQL scripts ran successfully
4. **Missing Data**: Verify the insert script completed without errors

## Next Steps

1. Run the SQL scripts in your Supabase dashboard
2. Start your application: `npm run dev`
3. Browse the products and test all functionality
4. The admin user email is `admin@lab404.com` for testing admin features