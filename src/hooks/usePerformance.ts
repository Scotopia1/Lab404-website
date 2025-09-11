import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Enhanced memoization hook with deep comparison
export const useDeepMemo = <T>(fn: () => T, deps: any[]): T => {
  const ref = useRef<{ deps: any[]; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: fn()
    };
  }

  return ref.current.value;
};

// Deep equality check for complex objects
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

// Debounced callback hook with cleanup
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T => {
  const inThrottle = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callbackRef.current(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [limit]
  );
};

// Memoized expensive computation hook
export const useMemoizedComputation = <T, TDeps extends readonly any[]>(
  computeFn: () => T,
  deps: TDeps,
  shouldCompute: boolean = true
): T | undefined => {
  return useMemo(() => {
    if (!shouldCompute) return undefined;
    
    const startTime = performance.now();
    const result = computeFn();
    const endTime = performance.now();
    
    // Log slow computations in development
    if (process.env.NODE_ENV === 'development' && endTime - startTime > 16) {
      console.warn(`Slow computation detected: ${endTime - startTime}ms`);
    }
    
    return result;
  }, deps);
};

// Virtual list item cache for better performance
export const useVirtualListCache = <T>(items: T[], keyExtractor: (item: T) => string) => {
  const cache = useRef(new Map<string, any>());
  
  return useMemo(() => {
    const newCache = new Map();
    
    items.forEach((item, index) => {
      const key = keyExtractor(item);
      if (cache.current.has(key)) {
        newCache.set(key, cache.current.get(key));
      } else {
        newCache.set(key, { item, index });
      }
    });
    
    cache.current = newCache;
    return newCache;
  }, [items, keyExtractor]);
};

// Performance monitoring hook
export const usePerformanceMonitor = (name: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>();
  
  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        
        if (process.env.NODE_ENV === 'development' && duration > 16) {
          console.log(`${name} render ${renderCount.current}: ${duration.toFixed(2)}ms`);
        }
      }
    };
  });
  
  return {
    renderCount: renderCount.current,
    markStart: () => {
      startTime.current = performance.now();
    },
    markEnd: (label?: string) => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        console.log(`${name} ${label || 'operation'}: ${duration.toFixed(2)}ms`);
      }
    }
  };
};

// Optimized selector hook for Zustand stores
export const useOptimizedSelector = <TState, TSelected>(
  store: any,
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean
) => {
  const lastSelected = useRef<TSelected>();
  const lastState = useRef<TState>();
  
  return useMemo(() => {
    const currentState = store.getState();
    
    // Skip selector if state hasn't changed
    if (lastState.current === currentState) {
      return lastSelected.current!;
    }
    
    const selected = selector(currentState);
    
    // Use custom equality function or reference equality
    const isEqual = equalityFn 
      ? equalityFn(lastSelected.current!, selected)
      : lastSelected.current === selected;
      
    if (!isEqual) {
      lastSelected.current = selected;
      lastState.current = currentState;
    }
    
    return lastSelected.current!;
  }, [store, selector, equalityFn]);
};

// Bundle size monitoring utility
export const useBundleAnalytics = () => {
  const [bundleInfo, setBundleInfo] = useState({
    initialChunks: 0,
    lazyChunks: 0,
    totalSize: 0,
    loadTime: 0
  });

  useEffect(() => {
    const measureBundleSize = () => {
      // Get performance navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        setBundleInfo(prev => ({
          ...prev,
          loadTime: navigation.loadEventEnd - navigation.fetchStart
        }));
      }

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = 0;
        let lazyChunks = 0;
        let initialChunks = 0;

        entries.forEach((entry: any) => {
          if (entry.name.includes('.js') || entry.name.includes('.css')) {
            totalSize += entry.transferSize || 0;
            
            if (entry.name.includes('chunk')) {
              lazyChunks += 1;
            } else {
              initialChunks += 1;
            }
          }
        });

        setBundleInfo(prev => ({
          ...prev,
          totalSize: prev.totalSize + totalSize,
          lazyChunks: prev.lazyChunks + lazyChunks,
          initialChunks: prev.initialChunks + initialChunks
        }));
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    };

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      return measureBundleSize();
    }
  }, []);

  return bundleInfo;
};

// Smart component memoization with props comparison
export const useSmartMemo = <TProps extends Record<string, any>>(
  component: React.ComponentType<TProps>,
  propsToCompare: (keyof TProps)[] = []
): React.ComponentType<TProps> => {
  return useMemo(() => {
    return React.memo(component, (prevProps, nextProps) => {
      // If no specific props to compare, use shallow comparison
      if (propsToCompare.length === 0) {
        return Object.keys(prevProps).every(key => prevProps[key] === nextProps[key]);
      }
      
      // Compare only specified props
      return propsToCompare.every(prop => prevProps[prop] === nextProps[prop]);
    });
  }, [component, propsToCompare]);
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

// Performance-aware state update hook
export const usePerformantState = <T>(
  initialState: T,
  updateThreshold: number = 16 // 16ms = 60fps
): [T, (newState: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState(initialState);
  const lastUpdateTime = useRef(0);
  const pendingUpdate = useRef<T | null>(null);

  const performantSetState = useCallback((newState: T | ((prev: T) => T)) => {
    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    if (timeSinceLastUpdate >= updateThreshold) {
      // Update immediately if enough time has passed
      setState(newState);
      lastUpdateTime.current = now;
    } else {
      // Schedule update for next frame
      const actualNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(pendingUpdate.current || state)
        : newState;
      
      pendingUpdate.current = actualNewState;

      requestAnimationFrame(() => {
        if (pendingUpdate.current !== null) {
          setState(pendingUpdate.current);
          pendingUpdate.current = null;
          lastUpdateTime.current = performance.now();
        }
      });
    }
  }, [state, updateThreshold]);

  return [state, performantSetState];
};

export default {
  useDeepMemo,
  useDebouncedCallback,
  useThrottledCallback,
  useMemoizedComputation,
  useVirtualListCache,
  usePerformanceMonitor,
  useOptimizedSelector,
  useBundleAnalytics,
  useSmartMemo,
  useIntersectionObserver,
  usePerformantState
};