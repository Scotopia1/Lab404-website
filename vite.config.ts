import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from 'vite-plugin-pwa';

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
    // Bundle analyzer - only in build mode
    mode === 'production' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  // Tree-shaking and optimization
  define: {
    __DEV__: mode === 'development',
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 500,
    // Production optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // 4KB
    reportCompressedSize: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [],
      // Input configuration
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Optimization options
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
      output: {
        manualChunks: (id) => {
          // Only split large vendor chunks to avoid empty chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react';
            }
            if (id.includes('@radix') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'data';
            }
            if (id.includes('framer-motion') || id.includes('zustand')) {
              return 'utils';
            }
            return 'vendor';
          }
        },
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
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
