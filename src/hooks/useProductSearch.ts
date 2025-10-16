import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface SearchFilters {
  category?: string;
  brand?: string;
  in_stock?: boolean;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  facets?: string[];
}

interface SearchResult {
  hits: any[];
  total: number;
  processingTimeMs: number;
  facets?: any;
}

interface UseProductSearchReturn {
  search: (query: string, filters?: SearchFilters) => Promise<SearchResult>;
  results: SearchResult | null;
  isLoading: boolean;
  isError: boolean;
  performanceMetrics: {
    lastSearchTime: number;
    averageSearchTime: number;
    searchCount: number;
  };
}

/**
 * Hook to search products using Meilisearch API
 * Provides fast, relevant search results with AI-powered features
 */
export function useProductSearch(): UseProductSearchReturn {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastSearchTime: 0,
    averageSearchTime: 0,
    searchCount: 0,
  });

  const searchMutation = useMutation({
    mutationFn: async ({ query, filters }: { query: string; filters?: SearchFilters }) => {
      const startTime = performance.now();
      const results = await apiClient.searchProducts(query, filters);
      const searchTime = performance.now() - startTime;

      // Update performance metrics
      setPerformanceMetrics(prev => {
        const newSearchCount = prev.searchCount + 1;
        const newAverageTime = 
          (prev.averageSearchTime * prev.searchCount + searchTime) / newSearchCount;

        return {
          lastSearchTime: searchTime,
          averageSearchTime: newAverageTime,
          searchCount: newSearchCount,
        };
      });

      return results;
    },
  });

  const search = async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
    const result = await searchMutation.mutateAsync({ query, filters });
    return result;
  };

  return {
    search,
    results: searchMutation.data || null,
    isLoading: searchMutation.isPending,
    isError: searchMutation.isError,
    performanceMetrics,
  };
}
