import { supabase } from '../supabase';
import type { Database } from '../supabase';

// =============================================
// DATABASE INITIALIZATION SERVICE
// =============================================

interface DatabaseInitResult {
  success: boolean;
  message: string;
  details: {
    tablesVerified: string[];
    dataSeeded: string[];
    errors: string[];
  };
}

export class DatabaseInitializationService {
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  private async getTableRowCount(tableName: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });
      
      return error ? 0 : (count || 0);
    } catch (error) {
      return 0;
    }
  }

  private async seedCategories(): Promise<boolean> {
    const categories = [
      { 
        name: 'Electronics', 
        slug: 'electronics', 
        description: 'Electronic devices and components',
        sort_order: 1 
      },
      { 
        name: 'Smartphones', 
        slug: 'smartphones', 
        description: 'Mobile phones and accessories',
        sort_order: 2
      },
      { 
        name: 'Laptops', 
        slug: 'laptops', 
        description: 'Laptop computers and accessories',
        sort_order: 3
      },
      { 
        name: 'Tablets', 
        slug: 'tablets', 
        description: 'Tablet devices and accessories',
        sort_order: 4
      },
      { 
        name: 'Accessories', 
        slug: 'accessories', 
        description: 'Electronic accessories and peripherals',
        sort_order: 5
      },
      { 
        name: 'Audio', 
        slug: 'audio', 
        description: 'Audio devices and equipment',
        sort_order: 6
      },
      { 
        name: 'Gaming', 
        slug: 'gaming', 
        description: 'Gaming devices and accessories',
        sort_order: 7
      },
      { 
        name: 'Smart Home', 
        slug: 'smart-home', 
        description: 'Smart home devices and IoT products',
        sort_order: 8
      }
    ];

    try {
      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert([category], { onConflict: 'slug' });
        
        if (error) {
          console.error(`Error seeding category ${category.name}:`, error);
          throw error;
        }
      }
      return true;
    } catch (error) {
      console.error('Error seeding categories:', error);
      return false;
    }
  }

  private async seedSuppliers(): Promise<boolean> {
    const suppliers = [
      {
        name: 'TechnoMax Industries',
        slug: 'technomax-industries',
        description: 'Leading supplier of consumer electronics and components',
        contact_person: 'Sarah Johnson',
        email: 'orders@technomax.com',
        phone: '+1-555-0123',
        website_url: 'https://technomax.com',
        city: 'Shenzhen',
        country: 'China',
        rating: 4.5
      },
      {
        name: 'Digital Solutions Corp',
        slug: 'digital-solutions-corp',
        description: 'Premium laptop and computer hardware supplier',
        contact_person: 'Michael Chen',
        email: 'sales@digitalsolutions.com',
        phone: '+1-555-0456',
        website_url: 'https://digitalsolutions.com',
        city: 'Taipei',
        country: 'Taiwan',
        rating: 4.7
      },
      {
        name: 'Mobile World Trading',
        slug: 'mobile-world-trading',
        description: 'Smartphone and mobile device distributor',
        contact_person: 'Elena Rodriguez',
        email: 'info@mobileworld.com',
        phone: '+1-555-0789',
        website_url: 'https://mobileworld.com',
        city: 'Hong Kong',
        country: 'Hong Kong',
        rating: 4.3
      }
    ];

    try {
      for (const supplier of suppliers) {
        const { error } = await supabase
          .from('suppliers')
          .upsert([supplier], { onConflict: 'slug' });
        
        if (error) {
          console.error(`Error seeding supplier ${supplier.name}:`, error);
          throw error;
        }
      }
      return true;
    } catch (error) {
      console.error('Error seeding suppliers:', error);
      return false;
    }
  }

  private async seedProducts(): Promise<boolean> {
    // First get category and supplier IDs
    const { data: categories } = await supabase.from('categories').select('id, slug');
    const { data: suppliers } = await supabase.from('suppliers').select('id, slug');

    if (!categories || !suppliers) {
      console.error('Categories or suppliers not found, cannot seed products');
      return false;
    }

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    const supplierMap = new Map(suppliers.map(s => [s.slug, s.id]));

    const products = [
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'The latest iPhone with pro camera system and titanium design',
        short_description: 'Premium smartphone with advanced camera system',
        sku: 'APPLE-IP15PRO-128',
        category_id: categoryMap.get('smartphones'),
        supplier_id: supplierMap.get('mobile-world-trading'),
        price: 999.00,
        compare_at_price: 1099.00,
        stock_quantity: 25,
        in_stock: true,
        images: ['/images/products/iphone-15-pro.jpg'],
        specifications: {
          'Display': '6.1" Super Retina XDR',
          'Processor': 'A17 Pro chip',
          'Storage': '128GB',
          'Camera': '48MP Main + 12MP Ultra Wide + 12MP Telephoto'
        },
        features: ['Face ID', '5G', 'Wireless Charging', 'Water Resistant'],
        tags: ['smartphone', 'apple', 'premium'],
        warranty_info: '1 year limited warranty',
        is_featured: true
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        description: 'Samsung\'s flagship smartphone with S Pen and advanced AI features',
        short_description: 'Ultimate Android smartphone with S Pen',
        sku: 'SAMSUNG-GS24U-256',
        category_id: categoryMap.get('smartphones'),
        supplier_id: supplierMap.get('mobile-world-trading'),
        price: 1199.00,
        stock_quantity: 18,
        in_stock: true,
        images: ['/images/products/galaxy-s24-ultra.jpg'],
        specifications: {
          'Display': '6.8" Dynamic AMOLED 2X',
          'Processor': 'Snapdragon 8 Gen 3',
          'Storage': '256GB',
          'Camera': '200MP Main + 50MP Periscope + 12MP Ultra Wide'
        },
        features: ['S Pen', '5G', 'Wireless Charging', 'IP68'],
        tags: ['smartphone', 'samsung', 'android', 's-pen'],
        warranty_info: '1 year manufacturer warranty',
        is_featured: true
      },
      {
        name: 'MacBook Pro 14" M3',
        slug: 'macbook-pro-14-m3',
        description: 'Apple MacBook Pro with M3 chip for professional performance',
        short_description: 'Professional laptop with M3 chip',
        sku: 'APPLE-MBP14-M3-512',
        category_id: categoryMap.get('laptops'),
        supplier_id: supplierMap.get('digital-solutions-corp'),
        price: 1999.00,
        stock_quantity: 12,
        in_stock: true,
        images: ['/images/products/macbook-pro-14.jpg'],
        specifications: {
          'Display': '14.2" Liquid Retina XDR',
          'Processor': 'Apple M3',
          'Memory': '8GB',
          'Storage': '512GB SSD'
        },
        features: ['Touch ID', 'Thunderbolt 4', 'MagSafe 3', 'Force Touch trackpad'],
        tags: ['laptop', 'apple', 'macbook', 'professional'],
        warranty_info: '1 year limited warranty',
        is_featured: true
      },
      {
        name: 'Dell XPS 13',
        slug: 'dell-xps-13',
        description: 'Ultra-portable laptop with stunning display and performance',
        short_description: 'Ultra-portable Windows laptop',
        sku: 'DELL-XPS13-I7-512',
        category_id: categoryMap.get('laptops'),
        supplier_id: supplierMap.get('digital-solutions-corp'),
        price: 1299.00,
        stock_quantity: 8,
        in_stock: true,
        images: ['/images/products/dell-xps-13.jpg'],
        specifications: {
          'Display': '13.4" FHD+',
          'Processor': 'Intel Core i7',
          'Memory': '16GB',
          'Storage': '512GB SSD'
        },
        features: ['Thunderbolt 4', 'WiFi 6E', 'Backlit Keyboard', 'Windows 11'],
        tags: ['laptop', 'dell', 'ultrabook', 'windows'],
        warranty_info: '1 year premium support'
      },
      {
        name: 'iPad Pro 12.9" M2',
        slug: 'ipad-pro-12-9-m2',
        description: 'Most advanced iPad with M2 chip and Liquid Retina XDR display',
        short_description: 'Professional tablet with M2 chip',
        sku: 'APPLE-IPADPRO-M2-256',
        category_id: categoryMap.get('tablets'),
        supplier_id: supplierMap.get('technomax-industries'),
        price: 1099.00,
        stock_quantity: 15,
        in_stock: true,
        images: ['/images/products/ipad-pro-12-9.jpg'],
        specifications: {
          'Display': '12.9" Liquid Retina XDR',
          'Processor': 'Apple M2',
          'Storage': '256GB',
          'Camera': '12MP Wide + 10MP Ultra Wide'
        },
        features: ['Apple Pencil support', 'Magic Keyboard compatible', '5G', 'USB-C'],
        tags: ['tablet', 'apple', 'ipad', 'professional'],
        warranty_info: '1 year limited warranty',
        is_featured: true
      },
      {
        name: 'AirPods Pro (3rd Gen)',
        slug: 'airpods-pro-3rd-gen',
        description: 'Premium wireless earbuds with active noise cancellation',
        short_description: 'Premium wireless earbuds with ANC',
        sku: 'APPLE-AIRPODSPRO-3G',
        category_id: categoryMap.get('audio'),
        supplier_id: supplierMap.get('technomax-industries'),
        price: 249.00,
        stock_quantity: 45,
        in_stock: true,
        images: ['/images/products/airpods-pro-3rd.jpg'],
        specifications: {
          'Driver': 'Custom high-excursion driver',
          'Chip': 'H2 chip',
          'Battery': 'Up to 6 hours (ANC on)',
          'Connectivity': 'Bluetooth 5.3'
        },
        features: ['Active Noise Cancellation', 'Spatial Audio', 'Transparency mode', 'MagSafe charging'],
        tags: ['earbuds', 'apple', 'wireless', 'noise-cancellation'],
        warranty_info: '1 year limited warranty'
      },
      {
        name: 'Sony WH-1000XM5',
        slug: 'sony-wh-1000xm5',
        description: 'Industry-leading noise canceling wireless headphones',
        short_description: 'Premium noise-canceling headphones',
        sku: 'SONY-WH1000XM5-BLK',
        category_id: categoryMap.get('audio'),
        supplier_id: supplierMap.get('technomax-industries'),
        price: 399.00,
        stock_quantity: 22,
        in_stock: true,
        images: ['/images/products/sony-wh-1000xm5.jpg'],
        specifications: {
          'Driver': '30mm dynamic drivers',
          'Battery': 'Up to 30 hours',
          'Frequency Response': '4Hz - 40kHz',
          'Weight': '250g'
        },
        features: ['Industry-leading ANC', 'LDAC codec', 'Touch controls', 'Quick attention mode'],
        tags: ['headphones', 'sony', 'wireless', 'noise-cancellation'],
        warranty_info: '1 year manufacturer warranty'
      },
      {
        name: 'Nintendo Switch OLED',
        slug: 'nintendo-switch-oled',
        description: 'Nintendo Switch with vibrant OLED screen and enhanced audio',
        short_description: 'Gaming console with OLED display',
        sku: 'NINTENDO-SWITCH-OLED',
        category_id: categoryMap.get('gaming'),
        supplier_id: supplierMap.get('technomax-industries'),
        price: 349.00,
        stock_quantity: 30,
        in_stock: true,
        images: ['/images/products/nintendo-switch-oled.jpg'],
        specifications: {
          'Display': '7" OLED touchscreen',
          'Storage': '64GB internal',
          'Battery': '4.5 - 9 hours',
          'Connectivity': 'Wi-Fi, Bluetooth 4.1'
        },
        features: ['Detachable Joy-Con', 'TV/Tabletop/Handheld modes', 'Enhanced audio', 'Wide adjustable stand'],
        tags: ['gaming', 'nintendo', 'console', 'portable'],
        warranty_info: '1 year limited warranty'
      },
      {
        name: 'Google Pixel 8 Pro',
        slug: 'google-pixel-8-pro',
        description: 'Google\'s flagship smartphone with advanced AI photography',
        short_description: 'AI-powered Android flagship',
        sku: 'GOOGLE-PIX8PRO-256',
        category_id: categoryMap.get('smartphones'),
        supplier_id: supplierMap.get('mobile-world-trading'),
        price: 899.00,
        stock_quantity: 20,
        in_stock: true,
        images: ['/images/products/pixel-8-pro.jpg'],
        specifications: {
          'Display': '6.7" LTPO OLED',
          'Processor': 'Google Tensor G3',
          'Storage': '256GB',
          'Camera': '50MP Main + 48MP Ultra Wide + 48MP Telephoto'
        },
        features: ['Magic Eraser', 'Call Screen', 'Live Translate', 'Pure Android'],
        tags: ['smartphone', 'google', 'pixel', 'ai-photography'],
        warranty_info: '1 year manufacturer warranty'
      },
      {
        name: 'Microsoft Surface Laptop 5',
        slug: 'microsoft-surface-laptop-5',
        description: 'Premium Windows laptop with sleek design and performance',
        short_description: 'Premium Windows ultrabook',
        sku: 'MS-SURFACE-L5-I7',
        category_id: categoryMap.get('laptops'),
        supplier_id: supplierMap.get('digital-solutions-corp'),
        price: 1599.00,
        stock_quantity: 10,
        in_stock: true,
        images: ['/images/products/surface-laptop-5.jpg'],
        specifications: {
          'Display': '13.5" PixelSense touchscreen',
          'Processor': 'Intel Core i7',
          'Memory': '16GB',
          'Storage': '512GB SSD'
        },
        features: ['Windows 11', 'All-day battery', 'Premium materials', 'Windows Hello'],
        tags: ['laptop', 'microsoft', 'surface', 'premium'],
        warranty_info: '1 year limited warranty'
      }
    ];

    try {
      let successCount = 0;
      for (const product of products) {
        if (product.category_id && product.supplier_id) {
          const { error } = await supabase
            .from('products')
            .upsert([product], { onConflict: 'slug' });
          
          if (error) {
            console.error(`Error seeding product ${product.name}:`, error);
          } else {
            successCount++;
          }
        } else {
          console.warn(`Skipping product ${product.name} - missing category or supplier reference`);
        }
      }
      
      console.log(`Successfully seeded ${successCount} products`);
      return successCount > 0;
    } catch (error) {
      console.error('Error seeding products:', error);
      return false;
    }
  }

  async initializeDatabase(): Promise<DatabaseInitResult> {
    const result: DatabaseInitResult = {
      success: true,
      message: '',
      details: {
        tablesVerified: [],
        dataSeeded: [],
        errors: []
      }
    };

    try {
      console.log('🚀 Starting database initialization...');

      // Check if tables exist
      const tables = ['categories', 'suppliers', 'products'];
      
      for (const table of tables) {
        const exists = await this.checkTableExists(table);
        if (exists) {
          result.details.tablesVerified.push(table);
          console.log(`✅ ${table} table verified`);
        } else {
          result.details.errors.push(`Table ${table} does not exist`);
          console.error(`❌ ${table} table not found`);
        }
      }

      // If core tables don't exist, we can't proceed with seeding
      if (result.details.errors.length > 0) {
        result.success = false;
        result.message = 'Core database tables are missing. Please run database migrations first.';
        return result;
      }

      // Check if we need to seed data
      const categoriesCount = await this.getTableRowCount('categories');
      const suppliersCount = await this.getTableRowCount('suppliers');
      const productsCount = await this.getTableRowCount('products');

      console.log(`📊 Current data counts - Categories: ${categoriesCount}, Suppliers: ${suppliersCount}, Products: ${productsCount}`);

      // Seed categories if empty
      if (categoriesCount === 0) {
        console.log('🌱 Seeding categories...');
        const success = await this.seedCategories();
        if (success) {
          result.details.dataSeeded.push('categories');
          console.log('✅ Categories seeded successfully');
        } else {
          result.details.errors.push('Failed to seed categories');
          console.error('❌ Failed to seed categories');
        }
      } else {
        console.log('📋 Categories already exist, skipping seed');
      }

      // Seed suppliers if empty
      if (suppliersCount === 0) {
        console.log('🌱 Seeding suppliers...');
        const success = await this.seedSuppliers();
        if (success) {
          result.details.dataSeeded.push('suppliers');
          console.log('✅ Suppliers seeded successfully');
        } else {
          result.details.errors.push('Failed to seed suppliers');
          console.error('❌ Failed to seed suppliers');
        }
      } else {
        console.log('🏢 Suppliers already exist, skipping seed');
      }

      // Seed products if empty (and we have categories and suppliers)
      if (productsCount === 0 && categoriesCount > 0 && suppliersCount > 0) {
        console.log('🌱 Seeding products...');
        const success = await this.seedProducts();
        if (success) {
          result.details.dataSeeded.push('products');
          console.log('✅ Products seeded successfully');
        } else {
          result.details.errors.push('Failed to seed products');
          console.error('❌ Failed to seed products');
        }
      } else if (productsCount > 0) {
        console.log('📦 Products already exist, skipping seed');
      } else {
        console.log('⚠️ Cannot seed products without categories and suppliers');
      }

      // Final result
      if (result.details.errors.length > 0) {
        result.success = false;
        result.message = `Database initialization completed with ${result.details.errors.length} errors`;
      } else {
        result.message = 'Database initialized successfully';
        if (result.details.dataSeeded.length === 0) {
          result.message += ' (no seeding needed - data already exists)';
        }
      }

      console.log('🎉 Database initialization completed!');
      return result;

    } catch (error) {
      console.error('💥 Database initialization failed:', error);
      result.success = false;
      result.message = `Database initialization failed: ${error}`;
      result.details.errors.push(String(error));
      return result;
    }
  }

  async verifyDatabase(): Promise<{ healthy: boolean; details: any }> {
    try {
      const tests = [
        { table: 'categories', expected: 'array' },
        { table: 'suppliers', expected: 'array' },
        { table: 'products', expected: 'array' }
      ];

      const results: any = {};
      let healthy = true;

      for (const test of tests) {
        try {
          const { data, error } = await supabase
            .from(test.table as any)
            .select('id, name')
            .limit(5);

          results[test.table] = {
            success: !error,
            count: data?.length || 0,
            error: error?.message
          };

          if (error) healthy = false;
        } catch (err) {
          results[test.table] = {
            success: false,
            error: String(err)
          };
          healthy = false;
        }
      }

      return {
        healthy,
        details: results
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: String(error) }
      };
    }
  }

  async getDataSummary(): Promise<any> {
    try {
      const [categoriesCount, suppliersCount, productsCount] = await Promise.all([
        this.getTableRowCount('categories'),
        this.getTableRowCount('suppliers'),
        this.getTableRowCount('products')
      ]);

      return {
        categories: categoriesCount,
        suppliers: suppliersCount,
        products: productsCount,
        total: categoriesCount + suppliersCount + productsCount
      };
    } catch (error) {
      return {
        error: String(error)
      };
    }
  }
}

// Export singleton instance
export const databaseInit = new DatabaseInitializationService();
export default databaseInit;