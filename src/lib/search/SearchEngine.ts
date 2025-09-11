import FlexSearch from 'flexsearch';
import { Product } from '@/lib/types';

export interface SearchOptions {
  limit?: number;
  suggest?: boolean;
  fuzzy?: boolean;
  threshold?: number;
  depth?: number;
  category?: string;
  priceRange?: { min: number; max: number };
  inStock?: boolean;
  featured?: boolean;
  brand?: string;
  rating?: number;
}

export interface SearchResult {
  product: Product;
  relevance: number;
  highlights: SearchHighlight[];
  matchedFields: string[];
}

export interface SearchHighlight {
  field: string;
  text: string;
  matches: { start: number; end: number; text: string }[];
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'tag';
  count: number;
  category?: string;
}

export interface SearchMetrics {
  query: string;
  resultsCount: number;
  searchTime: number;
  timestamp: number;
  filters: Record<string, any>;
}

export class ProductSearchEngine {
  private productIndex: FlexSearch.Index;
  private nameIndex: FlexSearch.Index;
  private descriptionIndex: FlexSearch.Index;
  private specificationIndex: FlexSearch.Index;
  private tagIndex: FlexSearch.Index;
  private documents: Map<string, Product>;
  private searchHistory: SearchMetrics[] = [];
  private popularSearches: Map<string, number> = new Map();

  constructor(products: Product[] = []) {
    // Initialize multiple indexes for different search strategies
    this.productIndex = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 9,
      depth: 4,
      bidirectional: true,
      suggest: true,
      cache: 100
    });

    // Specialized indexes for different fields
    this.nameIndex = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 9,
      suggest: true,
      cache: 50
    });

    this.descriptionIndex = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 5,
      depth: 2,
      cache: 50
    });

    this.specificationIndex = new FlexSearch.Index({
      tokenize: 'strict',
      resolution: 3,
      cache: 25
    });

    this.tagIndex = new FlexSearch.Index({
      tokenize: 'strict',
      resolution: 9,
      suggest: true,
      cache: 25
    });

    this.documents = new Map();
    this.buildIndex(products);
  }

  private buildIndex(products: Product[]) {
    products.forEach(product => {
      this.addProduct(product);
    });
  }

  public addProduct(product: Product) {
    this.documents.set(product.id, product);

    // Add to main index with all searchable content
    const searchableContent = this.extractSearchableContent(product);
    this.productIndex.add(product.id, searchableContent);

    // Add to specialized indexes
    this.nameIndex.add(product.id, product.name);
    
    if (product.description) {
      this.descriptionIndex.add(product.id, product.description);
    }

    // Index specifications
    if (product.specifications?.length) {
      const specText = product.specifications
        .map(spec => `${spec.name} ${spec.value}`)
        .join(' ');
      this.specificationIndex.add(product.id, specText);
    }

    // Index tags
    if (product.tags?.length) {
      const tagText = product.tags.join(' ');
      this.tagIndex.add(product.id, tagText);
    }
  }

  public removeProduct(productId: string) {
    this.documents.delete(productId);
    this.productIndex.remove(productId);
    this.nameIndex.remove(productId);
    this.descriptionIndex.remove(productId);
    this.specificationIndex.remove(productId);
    this.tagIndex.remove(productId);
  }

  public updateProduct(product: Product) {
    this.removeProduct(product.id);
    this.addProduct(product);
  }

  public search(query: string, options: SearchOptions = {}): SearchResult[] {
    const startTime = performance.now();
    const normalizedQuery = query.trim().toLowerCase();
    
    if (!normalizedQuery) {
      return [];
    }

    // Record search metrics
    this.recordSearch(normalizedQuery, options);

    // Get results from multiple indexes
    const mainResults = this.searchIndex(this.productIndex, normalizedQuery, options.limit || 50);
    const nameResults = this.searchIndex(this.nameIndex, normalizedQuery, 20);
    const descResults = this.searchIndex(this.descriptionIndex, normalizedQuery, 20);
    const specResults = this.searchIndex(this.specificationIndex, normalizedQuery, 15);
    const tagResults = this.searchIndex(this.tagIndex, normalizedQuery, 10);

    // Combine and score results
    const combinedResults = this.combineSearchResults(
      normalizedQuery,
      { main: mainResults, name: nameResults, desc: descResults, spec: specResults, tag: tagResults }
    );

    // Apply filters
    const filteredResults = this.applyFilters(combinedResults, options);

    // Apply final sorting and limiting
    const finalResults = filteredResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.limit || 50);

    // Record search time
    const searchTime = performance.now() - startTime;
    this.updateSearchMetrics(normalizedQuery, finalResults.length, searchTime, options);

    return finalResults;
  }

  public getSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];
    const seenTexts = new Set<string>();

    // Get suggestions from different sources
    const productSuggestions = this.getProductSuggestions(normalizedQuery);
    const categorySuggestions = this.getCategorySuggestions(normalizedQuery);
    const brandSuggestions = this.getBrandSuggestions(normalizedQuery);
    const tagSuggestions = this.getTagSuggestions(normalizedQuery);

    // Combine and deduplicate
    [...productSuggestions, ...categorySuggestions, ...brandSuggestions, ...tagSuggestions]
      .forEach(suggestion => {
        if (!seenTexts.has(suggestion.text) && suggestion.text.toLowerCase().includes(normalizedQuery)) {
          seenTexts.add(suggestion.text);
          suggestions.push(suggestion);
        }
      });

    return suggestions
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public getSearchHistory(): string[] {
    return Array.from(new Set(
      this.searchHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map(metric => metric.query)
    ));
  }

  public getPopularSearches(): string[] {
    return Array.from(this.popularSearches.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query]) => query);
  }

  public getSearchMetrics(): SearchMetrics[] {
    return [...this.searchHistory];
  }

  public clearSearchHistory() {
    this.searchHistory = [];
    this.popularSearches.clear();
  }

  private extractSearchableContent(product: Product): string {
    const parts = [
      product.name,
      product.description || '',
      product.category,
      product.brand || '',
      ...(product.tags || []),
      ...(product.specifications || []).map(spec => `${spec.name} ${spec.value}`)
    ];
    
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  private searchIndex(index: FlexSearch.Index, query: string, limit: number): string[] {
    try {
      const results = index.search(query, { limit });
      return Array.isArray(results) ? results as string[] : [];
    } catch (error) {
      console.warn('Search index error:', error);
      return [];
    }
  }

  private combineSearchResults(
    query: string,
    results: Record<string, string[]>
  ): SearchResult[] {
    const scoreMap = new Map<string, { scores: number[]; fields: string[] }>();

    // Score results from each index
    Object.entries(results).forEach(([source, ids]) => {
      ids.forEach((id, index) => {
        if (!scoreMap.has(id)) {
          scoreMap.set(id, { scores: [], fields: [] });
        }
        
        const item = scoreMap.get(id)!;
        const score = this.calculateSourceScore(source, ids.length - index, ids.length);
        item.scores.push(score);
        item.fields.push(source);
      });
    });

    // Convert to SearchResult objects
    const searchResults: SearchResult[] = [];
    
    scoreMap.forEach((data, productId) => {
      const product = this.documents.get(productId);
      if (!product) return;

      const relevance = this.calculateCombinedScore(data.scores);
      const highlights = this.generateHighlights(query, product);

      searchResults.push({
        product,
        relevance,
        highlights,
        matchedFields: [...new Set(data.fields)]
      });
    });

    return searchResults;
  }

  private calculateSourceScore(source: string, position: number, total: number): number {
    const baseScore = (total - position) / total;
    
    // Weight different sources
    const weights = {
      name: 1.0,     // Highest priority
      main: 0.8,     // Main search
      tag: 0.7,      // Tags are important
      spec: 0.6,     // Specifications
      desc: 0.5      // Description has lower priority
    };

    return baseScore * (weights[source as keyof typeof weights] || 0.5);
  }

  private calculateCombinedScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    // Use weighted average with boost for multiple matches
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const matchBoost = Math.min(scores.length / 5, 1); // Up to 5x boost for multiple field matches
    
    return avgScore * (1 + matchBoost);
  }

  private applyFilters(results: SearchResult[], options: SearchOptions): SearchResult[] {
    return results.filter(({ product }) => {
      if (options.category && product.category !== options.category) {
        return false;
      }

      if (options.priceRange) {
        const { min, max } = options.priceRange;
        if (product.price < min || product.price > max) {
          return false;
        }
      }

      if (options.inStock !== undefined && product.inStock !== options.inStock) {
        return false;
      }

      if (options.featured !== undefined && product.featured !== options.featured) {
        return false;
      }

      if (options.brand && product.brand !== options.brand) {
        return false;
      }

      if (options.rating && (product.rating || 0) < options.rating) {
        return false;
      }

      return true;
    });
  }

  private generateHighlights(query: string, product: Product): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);

    // Highlight matches in different fields
    this.highlightField('name', product.name, queryTerms, highlights);
    if (product.description) {
      this.highlightField('description', product.description, queryTerms, highlights);
    }
    this.highlightField('category', product.category, queryTerms, highlights);
    if (product.brand) {
      this.highlightField('brand', product.brand, queryTerms, highlights);
    }

    return highlights;
  }

  private highlightField(
    field: string,
    text: string,
    queryTerms: string[],
    highlights: SearchHighlight[]
  ) {
    const matches: { start: number; end: number; text: string }[] = [];
    const lowerText = text.toLowerCase();

    queryTerms.forEach(term => {
      let index = 0;
      while ((index = lowerText.indexOf(term, index)) !== -1) {
        matches.push({
          start: index,
          end: index + term.length,
          text: text.slice(index, index + term.length)
        });
        index += term.length;
      }
    });

    if (matches.length > 0) {
      highlights.push({
        field,
        text,
        matches: matches.sort((a, b) => a.start - b.start)
      });
    }
  }

  private recordSearch(query: string, options: SearchOptions) {
    // Update popular searches
    const currentCount = this.popularSearches.get(query) || 0;
    this.popularSearches.set(query, currentCount + 1);
  }

  private updateSearchMetrics(
    query: string,
    resultsCount: number,
    searchTime: number,
    options: SearchOptions
  ) {
    const metric: SearchMetrics = {
      query,
      resultsCount,
      searchTime,
      timestamp: Date.now(),
      filters: { ...options }
    };

    this.searchHistory.push(metric);

    // Keep only recent searches
    if (this.searchHistory.length > 1000) {
      this.searchHistory = this.searchHistory.slice(-500);
    }
  }

  private getProductSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    this.documents.forEach(product => {
      if (product.name.toLowerCase().includes(query)) {
        suggestions.push({
          text: product.name,
          type: 'product',
          count: 1,
          category: product.category
        });
      }
    });

    return suggestions;
  }

  private getCategorySuggestions(query: string): SearchSuggestion[] {
    const categories = new Map<string, number>();
    
    this.documents.forEach(product => {
      if (product.category.toLowerCase().includes(query)) {
        const count = categories.get(product.category) || 0;
        categories.set(product.category, count + 1);
      }
    });

    return Array.from(categories.entries()).map(([category, count]) => ({
      text: category,
      type: 'category' as const,
      count
    }));
  }

  private getBrandSuggestions(query: string): SearchSuggestion[] {
    const brands = new Map<string, number>();
    
    this.documents.forEach(product => {
      if (product.brand && product.brand.toLowerCase().includes(query)) {
        const count = brands.get(product.brand) || 0;
        brands.set(product.brand, count + 1);
      }
    });

    return Array.from(brands.entries()).map(([brand, count]) => ({
      text: brand,
      type: 'brand' as const,
      count
    }));
  }

  private getTagSuggestions(query: string): SearchSuggestion[] {
    const tags = new Map<string, number>();
    
    this.documents.forEach(product => {
      product.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          const count = tags.get(tag) || 0;
          tags.set(tag, count + 1);
        }
      });
    });

    return Array.from(tags.entries()).map(([tag, count]) => ({
      text: tag,
      type: 'tag' as const,
      count
    }));
  }
}

export default ProductSearchEngine;