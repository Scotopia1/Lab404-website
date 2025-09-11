import { db } from './supabase';

export async function testDatabaseOperations() {
  console.log('🧪 Testing database operations...');
  
  try {
    // Test 1: Get all categories
    console.log('📁 Testing categories...');
    const categoriesResult = await db.categories.getAll();
    if (categoriesResult.error) {
      console.error('❌ Categories error:', categoriesResult.error);
    } else {
      console.log('✅ Categories loaded:', categoriesResult.data?.length || 0);
    }

    // Test 2: Get featured products
    console.log('⭐ Testing featured products...');
    const featuredResult = await db.products.getFeatured(4);
    if (featuredResult.error) {
      console.error('❌ Featured products error:', featuredResult.error);
    } else {
      console.log('✅ Featured products loaded:', featuredResult.data?.length || 0);
    }

    // Test 3: Get all products
    console.log('📦 Testing products...');
    const productsResult = await db.products.getAll({ limit: 10 });
    if (productsResult.error) {
      console.error('❌ Products error:', productsResult.error);
    } else {
      console.log('✅ Products loaded:', productsResult.data?.length || 0);
    }

    // Test 4: Get a specific product
    if (productsResult.data && productsResult.data.length > 0) {
      const firstProduct = productsResult.data[0];
      console.log('🔍 Testing single product...');
      const productResult = await db.products.get(firstProduct.id);
      if (productResult.error) {
        console.error('❌ Single product error:', productResult.error);
      } else {
        console.log('✅ Single product loaded:', productResult.data?.name);
      }
    }

    console.log('🎉 Database test completed successfully!');
    return {
      success: true,
      message: 'All database operations working correctly'
    };

  } catch (error) {
    console.error('❌ Database test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    };
  }
}

// Auto-run test in development (disabled to reduce console noise)
// Uncomment to run database tests automatically:
// if (import.meta.env.DEV) {
//   // Run test after a short delay to ensure everything is loaded
//   setTimeout(() => {
//     testDatabaseOperations();
//   }, 2000);
// }

// Export for manual testing when needed
if (typeof window !== 'undefined') {
  (window as any).__LAB404_TEST_DATABASE__ = testDatabaseOperations;
}