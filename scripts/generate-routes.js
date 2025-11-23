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
    // Use the sitemap data endpoint for efficient fetching
    console.log('📦 Fetching sitemap data from API...');
    const sitemapResponse = await fetch(`${apiBaseUrl}/sitemap/data`);

    if (sitemapResponse.ok) {
      const sitemapData = await sitemapResponse.json();

      if (sitemapData.success && sitemapData.data) {
        // Add product routes
        const products = sitemapData.data.products || [];
        products.forEach((product) => {
          routes.push(product.url);
        });
        console.log(`✅ Added ${products.length} products to sitemap`);

        // Add blog routes
        const blogs = sitemapData.data.blogs || [];
        blogs.forEach((blog) => {
          routes.push(blog.url);
        });
        console.log(`✅ Added ${blogs.length} blog posts to sitemap`);
      }
    } else {
      const errorText = await sitemapResponse.text();
      console.warn('⚠️  Failed to fetch sitemap data:', errorText);
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
