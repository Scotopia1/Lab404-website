import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppErrorBoundary, PageErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { initializeStores, useSyncManager, useRealtimeCartSync } from '@/stores';
import { Suspense, useEffect, lazy } from 'react';
import SkipLinks from '@/components/SkipLinks';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
import { PageLoadingSkeleton } from '@/components/ui/LoadingStates';
import { useLocation } from 'react-router-dom';
import { errorTracker } from '@/lib/errorTracking';

// Lazy load pages with preloading for better performance
const Index = lazy(() => 
  import('./pages/Index').then(module => ({ default: module.default }))
);
const Store = lazy(() => 
  import('./pages/Store').then(module => ({ default: module.default }))
);
const ProductDetail = lazy(() =>
  import('./pages/ProductDetail').then(module => ({ default: module.default }))
);
const Admin = lazy(() =>
  import('./pages/Admin').then(module => ({ default: module.default }))
);
const Auth = lazy(() =>
  import('./pages/Auth').then(module => ({ default: module.default }))
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then(module => ({ default: module.default }))
);
const AlibabaImport = lazy(() =>
  import('./pages/AlibabaImport').then(module => ({ default: module.default }))
);
const Blog = lazy(() =>
  import('./pages/Blog').then(module => ({ default: module.default }))
);
const BlogPost = lazy(() =>
  import('./pages/BlogPost').then(module => ({ default: module.default }))
);
const Checkout = lazy(() =>
  import('./pages/Checkout').then(module => ({ default: module.default }))
);

// Preload commonly accessed routes
const preloadRoute = (routeLoader: () => Promise<any>) => {
  const componentImport = routeLoader();
  return componentImport;
};

// Preload critical routes after initial render
const PreloadManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Preload Store page if on homepage
    if (location.pathname === '/') {
      const timer = setTimeout(() => {
        preloadRoute(() => import('./pages/Store'));
      }, 2000); // Preload after 2 seconds
      return () => clearTimeout(timer);
    }
    
    // Preload ProductDetail if on Store page
    if (location.pathname === '/store') {
      const timer = setTimeout(() => {
        preloadRoute(() => import('./pages/ProductDetail'));
      }, 1000); // Preload after 1 second
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);
  
  return null;
};

// Configure React Query with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Track query errors
        errorTracker.captureError({
          message: `Query failed: ${error}`,
          level: 'warning',
          context: { failureCount, queryError: true }
        });
        
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
    mutations: {
      retry: false,
      onError: (error) => {
        errorTracker.captureError({
          message: `Mutation failed: ${error}`,
          level: 'error',
          context: { mutationError: true }
        });
      }
    },
  },
});


// Store Provider Component
const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize stores on app startup
  useEffect(() => {
    initializeStores();
  }, []);

  // Setup sync manager and real-time sync
  useSyncManager();
  useRealtimeCartSync();

  return <>{children}</>;
};

const App = () => (
  <AppErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WebSocketProvider>
            <StoreProvider>
              <TooltipProvider>
                <Toaster />
                <PWAUpdatePrompt />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <SkipLinks />
                <Suspense fallback={<PageLoadingSkeleton />}>
                <PreloadManager />
                <Routes>
                <Route 
                  path="/" 
                  element={
                    <PageErrorBoundary>
                      <Index />
                    </PageErrorBoundary>
                  } 
                />
                <Route 
                  path="/store" 
                  element={
                    <PageErrorBoundary>
                      <Store />
                    </PageErrorBoundary>
                  } 
                />
                <Route
                  path="/product/:id"
                  element={
                    <PageErrorBoundary>
                      <ProductDetail />
                    </PageErrorBoundary>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <PageErrorBoundary>
                      <Checkout />
                    </PageErrorBoundary>
                  }
                />
                <Route
                  path="/theElitesSolutions/adminLogin"
                  element={
                    <PageErrorBoundary>
                      <Auth />
                    </PageErrorBoundary>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <PageErrorBoundary>
                      <Blog />
                    </PageErrorBoundary>
                  }
                />
                <Route
                  path="/blog/:slug"
                  element={
                    <PageErrorBoundary>
                      <BlogPost />
                    </PageErrorBoundary>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <PageErrorBoundary>
                      <Admin />
                    </PageErrorBoundary>
                  }
                />
                <Route 
                  path="*" 
                  element={
                    <PageErrorBoundary>
                      <NotFound />
                    </PageErrorBoundary>
                  } 
                />
              </Routes>
            </Suspense>
              </BrowserRouter>
              </TooltipProvider>
            </StoreProvider>
          </WebSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </AppErrorBoundary>
);

export default App;