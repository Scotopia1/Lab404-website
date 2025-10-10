// vite.config.ts
import { defineConfig } from "file:///C:/Users/johnn/Documents/Private-work/The%20Elites/Partnerships/Anthony%20gemayel/Lab404/Lab404/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/johnn/Documents/Private-work/The%20Elites/Partnerships/Anthony%20gemayel/Lab404/Lab404/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { viteSourceLocator } from "file:///C:/Users/johnn/Documents/Private-work/The%20Elites/Partnerships/Anthony%20gemayel/Lab404/Lab404/node_modules/@metagptx/vite-plugin-source-locator/dist/index.mjs";
import { visualizer } from "file:///C:/Users/johnn/Documents/Private-work/The%20Elites/Partnerships/Anthony%20gemayel/Lab404/Lab404/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { VitePWA } from "file:///C:/Users/johnn/Documents/Private-work/The%20Elites/Partnerships/Anthony%20gemayel/Lab404/Lab404/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\johnn\\Documents\\Private-work\\The Elites\\Partnerships\\Anthony gemayel\\Lab404\\Lab404";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx"
    }),
    react(),
    // PWA Configuration
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}"]
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "LAB404 Electronics",
        short_name: "LAB404",
        description: "Premium electronics store in Lebanon - Smartphones, laptops, accessories and more",
        theme_color: "#007BFF",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        categories: ["shopping", "business"],
        lang: "en-US",
        dir: "ltr"
      },
      devOptions: {
        enabled: false
      }
    }),
    // Bundle analyzer - only in build mode
    mode === "production" && visualizer({
      filename: "dist/bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  // Tree-shaking and optimization
  define: {
    __DEV__: mode === "development"
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : []
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    target: "esnext",
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: mode === "development",
    chunkSizeWarningLimit: 500,
    // Production optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // 4KB
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
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      },
      // Optimization options
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react";
            }
            if (id.includes("@radix") || id.includes("lucide-react")) {
              return "ui";
            }
            if (id.includes("@supabase") || id.includes("@tanstack")) {
              return "data";
            }
            if (id.includes("framer-motion") || id.includes("zustand")) {
              return "utils";
            }
            return "vendor";
          }
        },
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    }
  }
}));
if (process.env.NODE_ENV !== "production") {
  console.log("\n\u{1F680} Performance Tips:");
  console.log("- Use lazy loading for large components");
  console.log("- Implement virtual scrolling for long lists");
  console.log("- Optimize images with proper formats and sizes");
  console.log("- Use React.memo for expensive components");
  console.log("- Monitor bundle size with: pnpm run build\n");
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqb2hublxcXFxEb2N1bWVudHNcXFxcUHJpdmF0ZS13b3JrXFxcXFRoZSBFbGl0ZXNcXFxcUGFydG5lcnNoaXBzXFxcXEFudGhvbnkgZ2VtYXllbFxcXFxMYWI0MDRcXFxcTGFiNDA0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqb2hublxcXFxEb2N1bWVudHNcXFxcUHJpdmF0ZS13b3JrXFxcXFRoZSBFbGl0ZXNcXFxcUGFydG5lcnNoaXBzXFxcXEFudGhvbnkgZ2VtYXllbFxcXFxMYWI0MDRcXFxcTGFiNDA0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9qb2hubi9Eb2N1bWVudHMvUHJpdmF0ZS13b3JrL1RoZSUyMEVsaXRlcy9QYXJ0bmVyc2hpcHMvQW50aG9ueSUyMGdlbWF5ZWwvTGFiNDA0L0xhYjQwNC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHZpdGVTb3VyY2VMb2NhdG9yIH0gZnJvbSBcIkBtZXRhZ3B0eC92aXRlLXBsdWdpbi1zb3VyY2UtbG9jYXRvclwiO1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHZpdGVTb3VyY2VMb2NhdG9yKHtcbiAgICAgIHByZWZpeDogXCJtZ3hcIixcbiAgICB9KSxcbiAgICByZWFjdCgpLFxuICAgIC8vIFBXQSBDb25maWd1cmF0aW9uXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdlYnAsanBnLGpwZWd9J11cbiAgICAgIH0sXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJywgJ21hc2tlZC1pY29uLnN2ZyddLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogJ0xBQjQwNCBFbGVjdHJvbmljcycsXG4gICAgICAgIHNob3J0X25hbWU6ICdMQUI0MDQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZW1pdW0gZWxlY3Ryb25pY3Mgc3RvcmUgaW4gTGViYW5vbiAtIFNtYXJ0cGhvbmVzLCBsYXB0b3BzLCBhY2Nlc3NvcmllcyBhbmQgbW9yZScsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzAwN0JGRicsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBjYXRlZ29yaWVzOiBbJ3Nob3BwaW5nJywgJ2J1c2luZXNzJ10sXG4gICAgICAgIGxhbmc6ICdlbi1VUycsXG4gICAgICAgIGRpcjogJ2x0cidcbiAgICAgIH0sXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgICB9XG4gICAgfSksXG4gICAgLy8gQnVuZGxlIGFuYWx5emVyIC0gb25seSBpbiBidWlsZCBtb2RlXG4gICAgbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIHZpc3VhbGl6ZXIoe1xuICAgICAgZmlsZW5hbWU6ICdkaXN0L2J1bmRsZS1hbmFseXNpcy5odG1sJyxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgLy8gVHJlZS1zaGFraW5nIGFuZCBvcHRpbWl6YXRpb25cbiAgZGVmaW5lOiB7XG4gICAgX19ERVZfXzogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIGRyb3A6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IFsnY29uc29sZScsICdkZWJ1Z2dlciddIDogW10sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIG1pbmlmeTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2VzYnVpbGQnIDogZmFsc2UsXG4gICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICAgIC8vIFByb2R1Y3Rpb24gb3B0aW1pemF0aW9uc1xuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NiwgLy8gNEtCXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWVcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIC8vIEV4dGVybmFsIGRlcGVuZGVuY2llcyB0aGF0IHNob3VsZG4ndCBiZSBidW5kbGVkXG4gICAgICBleHRlcm5hbDogW10sXG4gICAgICAvLyBJbnB1dCBjb25maWd1cmF0aW9uXG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLFxuICAgICAgfSxcbiAgICAgIC8vIE9wdGltaXphdGlvbiBvcHRpb25zXG4gICAgICB0cmVlc2hha2U6IHtcbiAgICAgICAgbW9kdWxlU2lkZUVmZmVjdHM6IGZhbHNlLFxuICAgICAgICBwcm9wZXJ0eVJlYWRTaWRlRWZmZWN0czogZmFsc2UsXG4gICAgICAgIHVua25vd25HbG9iYWxTaWRlRWZmZWN0czogZmFsc2VcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcbiAgICAgICAgICAvLyBPbmx5IHNwbGl0IGxhcmdlIHZlbmRvciBjaHVua3MgdG8gYXZvaWQgZW1wdHkgY2h1bmtzXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0ByYWRpeCcpIHx8IGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3VpJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykgfHwgaWQuaW5jbHVkZXMoJ0B0YW5zdGFjaycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnZGF0YSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2ZyYW1lci1tb3Rpb24nKSB8fCBpZC5pbmNsdWRlcygnenVzdGFuZCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndXRpbHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gQXNzZXQgbmFtaW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZSEuc3BsaXQoJy4nKTtcbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKC9wbmd8anBlP2d8c3ZnfGdpZnx0aWZmfGJtcHxpY28vaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2ltYWdlcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC9jc3MvaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2Nzcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgIH0sXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pKTtcblxuLy8gUGVyZm9ybWFuY2UgdGlwcyBsb2dnZWQgZHVyaW5nIGJ1aWxkXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICBjb25zb2xlLmxvZygnXFxuXHVEODNEXHVERTgwIFBlcmZvcm1hbmNlIFRpcHM6Jyk7XG4gIGNvbnNvbGUubG9nKCctIFVzZSBsYXp5IGxvYWRpbmcgZm9yIGxhcmdlIGNvbXBvbmVudHMnKTtcbiAgY29uc29sZS5sb2coJy0gSW1wbGVtZW50IHZpcnR1YWwgc2Nyb2xsaW5nIGZvciBsb25nIGxpc3RzJyk7XG4gIGNvbnNvbGUubG9nKCctIE9wdGltaXplIGltYWdlcyB3aXRoIHByb3BlciBmb3JtYXRzIGFuZCBzaXplcycpO1xuICBjb25zb2xlLmxvZygnLSBVc2UgUmVhY3QubWVtbyBmb3IgZXhwZW5zaXZlIGNvbXBvbmVudHMnKTtcbiAgY29uc29sZS5sb2coJy0gTW9uaXRvciBidW5kbGUgc2l6ZSB3aXRoOiBwbnBtIHJ1biBidWlsZFxcbicpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyZCxTQUFTLG9CQUFvQjtBQUN4ZixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsZUFBZTtBQUx4QixJQUFNLG1D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
