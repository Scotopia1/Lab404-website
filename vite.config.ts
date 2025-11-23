import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';
import { readFileSync, existsSync } from 'fs';

// Load dynamic routes from pre-generated file
let dynamicRoutes: string[] = [];
const dynamicRoutesPath = path.resolve(__dirname, 'dynamic-routes.json');
if (existsSync(dynamicRoutesPath)) {
  try {
    dynamicRoutes = JSON.parse(readFileSync(dynamicRoutesPath, 'utf-8'));
  } catch (error) {
    console.warn('⚠️  Failed to load dynamic routes, using empty array');
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'LAB404 Electronics',
        short_name: 'LAB404',
        description: 'Premium electronics store in Lebanon - Smartphones, laptops, accessories and more',
        theme_color: '#007BFF',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        categories: ['shopping', 'business'],
        lang: 'en-US',
        dir: 'ltr'
      },
      devOptions: {
        enabled: false
      }
    }),
    // Sitemap generation - only in build mode
    mode === 'production' && sitemap({
      hostname: process.env.VITE_COMPANY_WEBSITE || 'https://lab404electronics.com',
      dynamicRoutes: [
        ...dynamicRoutes,
        '/store',
        '/blog',
        '/checkout'
      ],
      exclude: ['/404'],
      readable: true,
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/theElitesSolutions/'],
        }
      ]
    }),
    // Bundle analyzer - only in build mode
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),

  // Optimize dependencies for better performance
  optimizeDeps: {
    include: [
      '@radix-ui/react-slider',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-alert-dialog',
      'framer-motion',
      'lucide-react',
      'react-router-dom',
      'sonner',
      'zustand',
      '@tanstack/react-query'
    ],
    exclude: [],
    // Force dep pre-bundling for faster HMR
    force: mode === 'development'
  },

  // Enhanced build performance
  esbuild: {
    // Remove console and debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Optimize for development
    target: 'es2020'
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    open: true,
    host: true,
    hmr: {
      overlay: true,
      port: 24678 // Use a different port for HMR to avoid conflicts
    },
    // Proxy API calls to backend in development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('🔴 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔵 Proxy request:', req.method, req.url);
          });
        }
      }
    },
    // Performance improvements for development
    fs: {
      // Allow serving files outside of workspace root
      allow: ['..']
    }
  },

  // Build optimizations
  build: {
    target: 'es2020',
    sourcemap: mode === 'development',
    // Disable modulepreload to prevent empty href warnings
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
          motion: ['framer-motion'],
          query: ['@tanstack/react-query'],
          store: ['zustand']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1600
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  }
}));

// Performance tips logged during build
if (process.env.NODE_ENV !== 'production') {
  console.log('\n🚀 Performance Tips:');
  console.log('- Use lazy loading for large components');
  console.log('- Implement virtual scrolling for long lists');
  console.log('- Optimize images with proper formats and sizes');
  console.log('- Use React.memo for expensive components');
  console.log('- Monitor bundle size with: pnpm run build\n');
}
