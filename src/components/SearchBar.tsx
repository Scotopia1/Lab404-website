import React, { useState, useEffect, useRef } from 'react';
import { useAccessibleAnnouncement } from '@/hooks/useFocusManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X, Clock, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProductSearch } from '@/hooks/useProductSearch';
import { apiClient } from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  id: string;
  name: string;
  category?: string;
  price?: number;
  image?: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  showPerformanceMetrics?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search electronics, components, Arduino...",
  showSuggestions = true,
  showPerformanceMetrics = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300); // Debounce suggestions by 300ms
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [lastResultCount, setLastResultCount] = useState<number>(0);

  const { search, isLoading, isError, performanceMetrics } = useProductSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { announce } = useAccessibleAnnouncement();

  // Note: Search history and popular searches are managed client-side
  // Future enhancement: Store in Meilisearch analytics

  // Update suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 0 && showSuggestions) {
      // Fetch suggestions from API
      apiClient.getSuggestions(debouncedQuery, 5)
        .then(newSuggestions => {
          setSuggestions(newSuggestions);
          announce(`${newSuggestions.length} suggestions available. Use arrow keys to navigate.`);
        })
        .catch(err => {
          console.error('Failed to fetch suggestions:', err);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, showSuggestions, announce]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Show/hide dropdown immediately, but suggestions will update via debounced effect
    if (value.trim().length > 0 && showSuggestions) {
      setShowDropdown(true);
    } else {
      setShowDropdown(value.trim().length === 0 && showSuggestions); // Show history when empty
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIndex = showDropdown && query.trim().length === 0 
        ? searchHistory.length + popularSearches.length - 1
        : suggestions.length - 1;
      setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (query.trim().length === 0) {
          // Handle history/popular selection
          const allItems = [...searchHistory, ...popularSearches];
          const selectedQuery = allItems[selectedIndex];
          handleSearch(selectedQuery);
        } else {
          // Handle suggestion selection
          const selectedSuggestion = suggestions[selectedIndex];
          handleSearch(selectedSuggestion.text);
        }
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    try {
      // Perform search to track performance and get result count
      const results = await search(searchQuery, { limit: 20 });
      setLastResultCount(results.total);
      
      // Announce search action with results
      const searchTime = results.processingTimeMs.toFixed(0);
      announce(`Found ${results.total} results for ${searchQuery} in ${searchTime} milliseconds`);

      // Update search history (client-side only)
      setSearchHistory(prev => {
        const updated = [searchQuery, ...prev.filter(item => item !== searchQuery)];
        return updated.slice(0, 10);
      });
    } catch (error) {
      console.error('Search failed:', error);
      announce(`Search failed. Please try again.`);
    }

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to store page with search query
      navigate(`/store?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (showSuggestions) {
      setShowDropdown(true);
    }
  };

  const renderDropdownContent = () => {
    if (query.trim().length === 0) {
      // Show search history and popular searches when input is empty
      return (
        <div className="py-2">
          {searchHistory.length > 0 && (
            <div className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((item, index) => (
                <motion.button
                  key={`history-${index}`}
                  id={`search-option-${index}`}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => handleSearch(item)}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{item}</span>
                </motion.button>
              ))}
            </div>
          )}
          
          {popularSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Popular Searches
              </div>
              {popularSearches.slice(0, 5).map((item, index) => (
                <motion.button
                  key={`popular-${index}`}
                  id={`search-option-${searchHistory.length + index}`}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedIndex === searchHistory.length + index ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => handleSearch(item)}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  role="option"
                  aria-selected={selectedIndex === searchHistory.length + index}
                >
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span>{item}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Show suggestions when typing
    return (
      <div className="py-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`suggestion-${index}`}
            id={`search-option-${index}`}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
              selectedIndex === index ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
            onClick={() => handleSearch(suggestion.name)}
            whileHover={{ backgroundColor: '#f9fafb' }}
            role="option"
            aria-selected={selectedIndex === index}
          >
            <Search className="h-4 w-4 text-gray-400" />
            <span>{suggestion.name}</span>
            {suggestion.type === 'category' && (
              <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Category
              </span>
            )}
          </motion.button>
        ))}
        
        {suggestions.length === 0 && query.trim().length > 0 && (
          <div className="px-4 py-3 text-gray-500 text-sm">
            No suggestions found for "{query}"
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={isLoading ? "Loading products..." : placeholder}
          disabled={isLoading}
          className="pl-10 pr-10 h-10 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-label="Search products"
          aria-describedby="search-instructions"
          aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
        />
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        
        {isError && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2" title="Search service unavailable">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
        
        <div id="search-instructions" className="sr-only">
          Use arrow keys to navigate suggestions, enter to search, escape to close
        </div>
      </div>
      
      {/* Performance metrics display (optional) */}
      {showPerformanceMetrics && performanceMetrics.searchCount > 0 && (
        <div className="mt-1 text-xs text-gray-500 flex items-center space-x-3">
          <span>Last: {performanceMetrics.lastSearchTime.toFixed(0)}ms</span>
          <span>Avg: {performanceMetrics.averageSearchTime.toFixed(0)}ms</span>
          <span>Searches: {performanceMetrics.searchCount}</span>
          {performanceMetrics.lastSearchTime > 200 && (
            <span className="text-yellow-600 font-medium">⚠ Slow</span>
          )}
        </div>
      )}

      <AnimatePresence>
        {showDropdown && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            role="listbox"
            aria-label="Search suggestions"
          >
            {renderDropdownContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;