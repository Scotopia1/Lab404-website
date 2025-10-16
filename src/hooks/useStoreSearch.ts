import { useState, useCallback, useEffect } from 'react';
import { useProductSearch } from './useProductSearch';

/**
 * Store page filters interface
 */
export interface StoreFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price-low' | 'price-high';
  limit?: number;
  offset?: number;
}

/**
 * Store search results interface
 */
export interface StoreSearchResults {
  products: any[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  performanceMetrics: {
    lastSearchTime: number;
    averageSearchTime: number;
    searchCount: number;
  };
  facets?: {
    category?: Record<string, number>;
    brand?: Record<string, number>;
    in_stock?: Record<string, number>;
  };
}

/**
 * Hook return interface
 */
export interface UseStoreSearchReturn extends StoreSearchResults {
  search: (query: string, filters?: StoreFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Map Store sort options to Meilisearch format
 */
const mapSortToMeilisearch = (sortBy?: string) => {
  switch (sortBy) {
    case 'name':
      return { sort_by: 'name', sort_order: 'asc' as const };
    case 'price-low':
      return { sort_by: 'price', sort_order: 'asc' as const };
    case 'price-high':
      return { sort_by: 'price', sort_order: 'desc' as const };
    default:
      return { sort_by: 'created_at', sort_order: 'desc' as const };
  }
};

/**
 * Custom hook for Store page product search using Meilisearch
 * 
 * Features:
 * - Full-text search with AI-powered relevance
 * - Typo tolerance
 * - Category filtering
 * - Price range filtering
 * - Sorting (name, price)
 * - Pagination (offset-based)
 * - Performance tracking
 * 
 * @example
 * ```tsx
 * const { products, total, isLoading, search, loadMore, hasMore } = useStoreSearch();
 * 
 * // Search with filters
 * search('arduino', {
 *   category: 'Arduino',
 *   minPrice: 10,
 *   maxPrice: 100,
 *   sortBy: 'price-low',
 *   limit: 20
 * });
 * 
 * // Load more results
 * if (hasMore) {
 *   loadMore();
 * }
 * ```
 */
export function useStoreSearch(): UseStoreSearchReturn {
  const {
    search: meilisearchSearch,
    results,
    isLoading,
    isError,
    performanceMetrics
  } = useProductSearch();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [facets, setFacets] = useState<any>(undefined);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentFilters, setCurrentFilters] = useState<StoreFilters>({});
  const [currentOffset, setCurrentOffset] = useState<number>(0);

  /**
   * Perform search with filters
   */
  const search = useCallback(async (query: string, filters: StoreFilters = {}) => {
    const { sortBy, limit = 20, offset = 0, ...storeFilters } = filters;

    // Map sort options
    const { sort_by, sort_order } = mapSortToMeilisearch(sortBy);

    // Build Meilisearch filters
    const meilisearchFilters: any = {
      limit,
      offset,
      sort_by,
      sort_order,
      facets: ['category', 'brand', 'in_stock'],
    };

    // Add category filter
    if (storeFilters.category) {
      meilisearchFilters.category = storeFilters.category;
    }

    // Add price range filters
    if (storeFilters.minPrice !== undefined && storeFilters.minPrice > 0) {
      meilisearchFilters.min_price = storeFilters.minPrice;
    }
    if (storeFilters.maxPrice !== undefined && storeFilters.maxPrice < 3000) {
      meilisearchFilters.max_price = storeFilters.maxPrice;
    }

    try {
      // Perform Meilisearch query
      const searchResults = await meilisearchSearch(query || '', meilisearchFilters);

      // Update state
      if (offset === 0) {
        // New search - replace products
        setProducts(searchResults.hits);
      } else {
        // Load more - append products
        setProducts(prev => [...prev, ...searchResults.hits]);
      }

      setTotal(searchResults.total);
      setFacets(searchResults.facets);
      setCurrentQuery(query);
      setCurrentFilters(filters);
      setCurrentOffset(offset);
    } catch (error) {
      console.error('Store search failed:', error);
      // On error, keep previous results
    }
  }, [meilisearchSearch]);

  /**
   * Load more products (pagination)
   */
  const loadMore = useCallback(async () => {
    const newOffset = currentOffset + (currentFilters.limit || 20);
    await search(currentQuery, {
      ...currentFilters,
      offset: newOffset,
    });
  }, [search, currentQuery, currentFilters, currentOffset]);

  /**
   * Check if there are more products to load
   */
  const hasMore = products.length < total;

  /**
   * Update products when search results change
   */
  useEffect(() => {
    if (results) {
      // Results already handled in search function
      // This effect is for any additional processing if needed
    }
  }, [results]);

  return {
    products,
    total,
    isLoading,
    isError,
    performanceMetrics,
    facets,
    search,
    loadMore,
    hasMore,
  };
}

/**
 * Helper function to get categories from facets
 */
export const getCategoriesFromFacets = (facets?: Record<string, Record<string, number>>): string[] => {
  if (!facets || !facets.category) {
    return [];
  }
  return Object.keys(facets.category);
};

/**
 * Helper function to format category name
 */
export const formatCategoryName = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};
