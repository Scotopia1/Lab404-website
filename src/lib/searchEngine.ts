// Advanced Search Engine Implementation for LAB404 Electronics
// Based on comprehensive research combining fuzzy search, BM25, and auto-complete

import { Product } from './types';

export interface SearchResult {
  product: Product;
  score: number;
  matchedFields: string[];
  highlightedTitle?: string;
  highlightedDescription?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

export interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  brand?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}

// Levenshtein Distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// BM25 Algorithm Implementation
class BM25 {
  private k1 = 1.2;
  private b = 0.75;
  private documents: Array<{ id: string; tokens: string[]; length: number }> = [];
  private avgDocLength = 0;
  private termFreqs: Map<string, Map<string, number>> = new Map();
  private docFreqs: Map<string, number> = new Map();

  constructor(products: Product[]) {
    this.indexProducts(products);
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  private indexProducts(products: Product[]) {
    let totalLength = 0;

    products.forEach(product => {
      const searchText = `${product.name} ${product.description} ${product.category} ${product.brand || ''}`;
      const tokens = this.tokenize(searchText);
      const docId = product.id;

      this.documents.push({ id: docId, tokens, length: tokens.length });
      totalLength += tokens.length;

      // Calculate term frequencies for this document
      const termFreq = new Map<string, number>();
      tokens.forEach(token => {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      });
      this.termFreqs.set(docId, termFreq);

      // Update document frequencies
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        this.docFreqs.set(token, (this.docFreqs.get(token) || 0) + 1);
      });
    });

    this.avgDocLength = totalLength / this.documents.length;
  }

  search(query: string): Map<string, number> {
    const queryTokens = this.tokenize(query);
    const scores = new Map<string, number>();

    this.documents.forEach(doc => {
      let score = 0;
      const termFreq = this.termFreqs.get(doc.id)!;

      queryTokens.forEach(token => {
        const tf = termFreq.get(token) || 0;
        const df = this.docFreqs.get(token) || 0;
        
        if (tf > 0 && df > 0) {
          const idf = Math.log((this.documents.length - df + 0.5) / (df + 0.5));
          const tfComponent = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDocLength)));
          score += idf * tfComponent;
        }
      });

      if (score > 0) {
        scores.set(doc.id, score);
      }
    });

    return scores;
  }
}

// Trie for auto-complete
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord = false;
  suggestions: string[] = [];
}

class Trie {
  private root = new TrieNode();

  insert(word: string) {
    let current = this.root;
    
    for (const char of word.toLowerCase()) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
      
      // Add suggestion to each node along the path
      if (!current.suggestions.includes(word)) {
        current.suggestions.push(word);
        current.suggestions.sort((a, b) => a.length - b.length);
        if (current.suggestions.length > 10) {
          current.suggestions = current.suggestions.slice(0, 10);
        }
      }
    }
    
    current.isEndOfWord = true;
  }

  getSuggestions(prefix: string, maxSuggestions = 10): string[] {
    let current = this.root;
    
    for (const char of prefix.toLowerCase()) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }
    
    return current.suggestions.slice(0, maxSuggestions);
  }
}

// Main Search Engine Class
export class SearchEngine {
  private products: Product[] = [];
  private bm25: BM25;
  private trie = new Trie();
  private searchHistory: string[] = [];
  private popularSearches: Map<string, number> = new Map();

  constructor(products: Product[]) {
    this.products = products;
    this.bm25 = new BM25(products);
    this.buildTrie();
  }

  private buildTrie() {
    this.products.forEach(product => {
      // Add product names
      this.trie.insert(product.name);
      
      // Add individual words from product names
      product.name.split(' ').forEach(word => {
        if (word.length > 2) {
          this.trie.insert(word);
        }
      });
      
      // Add categories and brands
      this.trie.insert(product.category);
      if (product.brand) {
        this.trie.insert(product.brand);
      }
    });
  }

  // Highlight matched terms in text
  private highlightMatches(text: string, query: string): string {
    const queryTokens = query.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    queryTokens.forEach(token => {
      if (token.length > 1) {
        const regex = new RegExp(`(${token})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
      }
    });
    
    return highlightedText;
  }

  // Get search suggestions
  getSuggestions(query: string): SearchSuggestion[] {
    if (query.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const trieSuggestions = this.trie.getSuggestions(query, 5);
    
    // Add trie suggestions
    trieSuggestions.forEach(suggestion => {
      suggestions.push({
        text: suggestion,
        type: 'product'
      });
    });

    // Add fuzzy matches for typos
    if (suggestions.length < 5) {
      this.products.forEach(product => {
        const distance = levenshteinDistance(query.toLowerCase(), product.name.toLowerCase());
        const threshold = Math.max(2, Math.floor(query.length * 0.3));
        
        if (distance <= threshold && distance > 0) {
          const exists = suggestions.some(s => s.text.toLowerCase() === product.name.toLowerCase());
          if (!exists) {
            suggestions.push({
              text: product.name,
              type: 'product'
            });
          }
        }
      });
    }

    return suggestions.slice(0, 8);
  }

  // Main search function
  search(query: string, filters?: SearchFilters): SearchResult[] {
    if (!query.trim()) {
      let results = this.products.map(product => ({
        product,
        score: 1,
        matchedFields: []
      }));

      // Apply filters
      if (filters) {
        results = this.applyFilters(results, filters);
      }

      return this.sortResults(results, filters?.sortBy || 'relevance');
    }

    // Track search
    this.trackSearch(query);

    // Get BM25 scores
    const bm25Scores = this.bm25.search(query);
    const results: SearchResult[] = [];

    // Exact matches get highest priority
    this.products.forEach(product => {
      let score = bm25Scores.get(product.id) || 0;
      const matchedFields: string[] = [];
      
      const queryLower = query.toLowerCase();
      const productNameLower = product.name.toLowerCase();
      const productDescLower = product.description.toLowerCase();

      // Boost exact matches
      if (productNameLower.includes(queryLower)) {
        score += 10;
        matchedFields.push('name');
      }
      
      if (productDescLower.includes(queryLower)) {
        score += 5;
        matchedFields.push('description');
      }

      if (product.category.toLowerCase().includes(queryLower)) {
        score += 3;
        matchedFields.push('category');
      }

      if (product.brand?.toLowerCase().includes(queryLower)) {
        score += 3;
        matchedFields.push('brand');
      }

      // Fuzzy matching for typos
      if (score === 0) {
        const distance = levenshteinDistance(queryLower, productNameLower);
        const threshold = Math.max(2, Math.floor(queryLower.length * 0.4));
        
        if (distance <= threshold) {
          score = Math.max(0, 5 - distance);
          matchedFields.push('fuzzy_name');
        }
      }

      if (score > 0) {
        results.push({
          product,
          score,
          matchedFields,
          highlightedTitle: this.highlightMatches(product.name, query),
          highlightedDescription: this.highlightMatches(product.description, query)
        });
      }
    });

    // Apply filters
    const filteredResults = filters ? this.applyFilters(results, filters) : results;

    // Sort results
    return this.sortResults(filteredResults, filters?.sortBy || 'relevance');
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      const { product } = result;

      if (filters.category && product.category !== filters.category) {
        return false;
      }

      if (filters.brand && product.brand !== filters.brand) {
        return false;
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (product.price < min || product.price > max) {
          return false;
        }
      }

      return true;
    });
  }

  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    return results.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.product.price - b.product.price;
        case 'price_desc':
          return b.product.price - a.product.price;
        case 'name':
          return a.product.name.localeCompare(b.product.name);
        case 'newest':
          return new Date(b.product.createdAt || 0).getTime() - new Date(a.product.createdAt || 0).getTime();
        case 'relevance':
        default:
          return b.score - a.score;
      }
    });
  }

  private trackSearch(query: string) {
    // Add to search history
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 50); // Keep last 50 searches

    // Track popular searches
    const count = this.popularSearches.get(query) || 0;
    this.popularSearches.set(query, count + 1);
  }

  getSearchHistory(): string[] {
    return this.searchHistory.slice(0, 10);
  }

  getPopularSearches(): string[] {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query]) => query);
  }

  // Get "Did you mean?" suggestions
  getDidYouMean(query: string): string | null {
    let bestMatch = '';
    let bestDistance = Infinity;
    const threshold = Math.max(2, Math.floor(query.length * 0.5));

    this.products.forEach(product => {
      const distance = levenshteinDistance(query.toLowerCase(), product.name.toLowerCase());
      if (distance < bestDistance && distance <= threshold && distance > 0) {
        bestDistance = distance;
        bestMatch = product.name;
      }
    });

    return bestMatch || null;
  }
}

// Export utility functions
export { levenshteinDistance };