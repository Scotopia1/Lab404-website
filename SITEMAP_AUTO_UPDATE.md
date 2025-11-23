# Automatic Sitemap Update System

This document explains how the automatic sitemap update system works for LAB404 Electronics.

## Overview

The sitemap system has been moved from the backend to the frontend and now automatically updates whenever products or blog posts are added, updated, or deleted.

## Architecture

### 1. Backend Webhook System

**Location**: `lab404-backend/src/services/WebhookService.ts`

The webhook service triggers notifications whenever:
- Products are created, updated, or deleted
- Blog posts are created, updated, or deleted (when status is "published")

**Triggered Events**:
- `product.created`
- `product.updated`
- `product.deleted`
- `blog.created`
- `blog.updated`
- `blog.deleted`

### 2. Frontend Sitemap Generation

**Location**: `Lab404/`

The frontend generates the sitemap during build time:
1. Pre-build script (`scripts/generate-routes.js`) fetches products and blog posts from API
2. Routes are saved to `dynamic-routes.json`
3. Vite plugin generates `sitemap.xml` and `robots.txt` in the `dist` folder

**Files**:
- `scripts/generate-routes.js` - Fetches dynamic routes from backend
- `vite.config.ts` - Configures sitemap plugin
- `dynamic-routes.json` - Cached routes (generated at build time)

## Setup Instructions

### Option 1: Automatic Deployment (Recommended)

Configure deployment webhooks to automatically rebuild the frontend when content changes.

#### For Vercel:

1. Go to your Vercel project
2. Navigate to **Settings → Git → Deploy Hooks**
3. Create a new deploy hook (e.g., "Sitemap Update")
4. Copy the webhook URL
5. Add to backend `.env`:
   ```bash
   DEPLOYMENT_WEBHOOK_URL=https://api.vercel.com/v1/integrations/deploy/PROJECT_ID/HOOK_ID
   ```

#### For Netlify:

1. Go to your Netlify site
2. Navigate to **Site Settings → Build & deploy → Build hooks**
3. Create a new build hook (e.g., "Sitemap Update")
4. Copy the webhook URL
5. Add to backend `.env`:
   ```bash
   DEPLOYMENT_WEBHOOK_URL=https://api.netlify.com/build_hooks/HOOK_ID
   ```

#### For Other Platforms:

Configure a webhook URL that triggers a new deployment/build of your frontend.

### Option 2: Manual Regeneration

If you prefer manual control, you can regenerate the sitemap by:

```bash
cd Lab404
pnpm run generate:routes
pnpm run build
```

Then deploy the updated `dist` folder to your hosting platform.

### Option 3: Scheduled Regeneration

Set up a cron job or GitHub Action to automatically rebuild periodically:

**Example GitHub Action** (`.github/workflows/sitemap-update.yml`):
```yaml
name: Update Sitemap
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  update-sitemap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: cd Lab404 && pnpm install
      - name: Generate routes
        run: cd Lab404 && pnpm run generate:routes
      - name: Build frontend
        run: cd Lab404 && pnpm run build
      - name: Deploy
        run: # Add your deployment command here
```

## How It Works

### When a Product is Added/Updated/Deleted:

1. **Admin creates/updates/deletes a product** via the admin panel
2. **Backend ProductService** processes the request
3. **WebhookService triggers** deployment webhook
4. **Hosting platform** (Vercel/Netlify) receives webhook
5. **New deployment starts** automatically
6. **Build process runs**:
   - `prebuild` script executes
   - `generate-routes.js` fetches all products from API
   - Routes saved to `dynamic-routes.json`
   - Vite generates new `sitemap.xml` with updated products
7. **New sitemap deployed** with the updated content

### When a Blog Post is Published/Updated/Deleted:

Same process as products, but only triggered when blog post status is "published".

## API Endpoints

### Get Sitemap Data

**Endpoint**: `GET /api/sitemap/data`

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "slug": "product-slug",
        "url": "/product/uuid",
        "lastmod": "2025-11-23T12:00:00.000Z"
      }
    ],
    "blogs": [
      {
        "id": "uuid",
        "slug": "blog-slug",
        "url": "/blog/blog-slug",
        "lastmod": "2025-11-23T12:00:00.000Z"
      }
    ],
    "static": [
      { "url": "/", "changefreq": "daily", "priority": 1.0 },
      { "url": "/store", "changefreq": "daily", "priority": 0.9 }
    ]
  },
  "timestamp": "2025-11-23T12:00:00.000Z"
}
```

## Sitemap Location

After build, the sitemap is available at:
- **Development**: `Lab404/dist/sitemap.xml`
- **Production**: `https://yourdomain.com/sitemap.xml`
- **Robots.txt**: `https://yourdomain.com/robots.txt`

## Sitemap Content

The generated sitemap includes:

### Static Routes:
- `/` (Homepage) - Priority: 1.0, Updated: Daily
- `/store` (Products page) - Priority: 0.9, Updated: Daily
- `/blog` (Blog listing) - Priority: 0.8, Updated: Daily
- `/checkout` (Checkout page) - Priority: 0.6, Updated: Weekly

### Dynamic Routes:
- `/product/:id` - All active products - Priority: 0.8, Updated: Weekly
- `/blog/:slug` - All published blog posts - Priority: 0.7, Updated: Monthly

### Excluded Routes:
- `/admin/*` - Admin panel (private)
- `/theElitesSolutions/*` - Admin login (private)

## Troubleshooting

### Sitemap not updating

1. **Check webhook configuration**:
   ```bash
   # Verify in backend .env
   echo $DEPLOYMENT_WEBHOOK_URL
   ```

2. **Check backend logs**:
   ```bash
   # Look for webhook trigger messages
   grep "Triggering deployment webhook" logs/app.log
   ```

3. **Manual trigger**:
   ```bash
   curl -X POST $DEPLOYMENT_WEBHOOK_URL
   ```

### Build failing during route generation

1. **Ensure backend is accessible**:
   ```bash
   curl http://localhost:3000/api/products
   ```

2. **Check API base URL**:
   ```bash
   # In Lab404/.env.local
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

3. **Build with empty routes**:
   - The build will continue even if route fetching fails
   - Static routes will still be included

### Webhook not triggering

1. **Check webhook URL validity**
2. **Check network/firewall settings**
3. **Verify webhook logs** in hosting platform dashboard

## Testing

### Test Webhook Manually:

```bash
# Test deployment webhook
curl -X POST -H "Content-Type: application/json" \
  -d '{"reason":"Manual test"}' \
  $DEPLOYMENT_WEBHOOK_URL
```

### Test Sitemap Generation:

```bash
cd Lab404
pnpm run generate:routes
cat dynamic-routes.json
pnpm run build
cat dist/sitemap.xml
```

### Test Product/Blog Creation:

1. Log into admin panel
2. Create a new product or blog post
3. Check backend logs for webhook trigger
4. Wait for deployment to complete
5. Visit `/sitemap.xml` and verify new content

## Benefits

✅ **Automatic**: No manual sitemap updates needed
✅ **Real-time**: Sitemap updates within minutes of content changes
✅ **SEO-friendly**: Search engines always have fresh content
✅ **No Backend Overhead**: Sitemap generation moved to build time
✅ **Scalable**: Works with any number of products/blogs
✅ **Flexible**: Multiple deployment options (webhooks, cron, manual)

## Notes

- Webhook calls are non-blocking and won't slow down product/blog operations
- Failed webhook calls are logged but don't affect normal operations
- Sitemap is generated only during production builds
- Development server doesn't regenerate sitemap automatically
