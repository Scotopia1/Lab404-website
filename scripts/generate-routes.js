// Pre-build script to generate dynamic routes for sitemap
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Fetch dynamic routes from backend API
 */
async function fetchDynamicRoutes() {
  const routes = [];

  // Get API base URL from environment or use default
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  try {
    // Fetch all products
    console.log('📦 Fetching products for sitemap...');
    const productsResponse = await fetch(`${apiBaseUrl}/products?limit=1000&is_active=true`);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data || [];

      products.forEach((product) => {
        routes.push(`/product/${product.id}`);
      });
      console.log(`✅ Added ${products.length} products to sitemap`);
    } else {
      console.warn('⚠️  Failed to fetch products:', productsResponse.statusText);
    }

    // Fetch all published blog posts
    console.log('📝 Fetching blog posts for sitemap...');
    const blogsResponse = await fetch(`${apiBaseUrl}/blogs/posts?limit=1000&status=published`);
    if (blogsResponse.ok) {
      const blogsData = await blogsResponse.json();
      const blogs = blogsData.data || [];

      blogs.forEach((blog) => {
        routes.push(`/blog/${blog.slug}`);
      });
      console.log(`✅ Added ${blogs.length} blog posts to sitemap`);
    } else {
      console.warn('⚠️  Failed to fetch blog posts:', blogsResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Error fetching dynamic routes for sitemap:', error);
    console.log('⚠️  Continuing with empty dynamic routes...');
  }

  return routes;
}

/**
 * Main function
 */
async function main() {
  console.log('\n🗺️  Generating routes for sitemap...\n');

  const dynamicRoutes = await fetchDynamicRoutes();

  const routesFilePath = join(__dirname, '..', 'dynamic-routes.json');

  writeFileSync(routesFilePath, JSON.stringify(dynamicRoutes, null, 2));

  console.log(`\n📊 Total dynamic routes: ${dynamicRoutes.length}`);
  console.log(`✅ Routes saved to: ${routesFilePath}\n`);
}

main().catch((error) => {
  console.error('❌ Failed to generate routes:', error);
  // Write empty array to allow build to continue
  const routesFilePath = join(__dirname, '..', 'dynamic-routes.json');
  writeFileSync(routesFilePath, JSON.stringify([], null, 2));
  process.exit(0); // Don't fail the build
});
