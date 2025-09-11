import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// =============================================
// TYPES
// =============================================

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'price-low' | 'price-high' | 'newest' | 'rating' | 'featured';
export type Theme = 'light' | 'dark' | 'system';
export type Currency = 'USD' | 'LBP' | 'EUR';
export type Language = 'en' | 'ar' | 'fr';

export interface ProductViewPreferences {
  viewMode: ViewMode;
  sortBy: SortOption;
  itemsPerPage: number;
  showOutOfStock: boolean;
  showComparePrice: boolean;
  enableQuickView: boolean;
}

export interface SearchPreferences {
  recentSearches: string[];
  maxRecentSearches: number;
  enableSearchSuggestions: boolean;
  enableAutoComplete: boolean;
  saveSearchHistory: boolean;
}

export interface NotificationPreferences {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  notifyOnPriceDrops: boolean;
  notifyOnBackInStock: boolean;
  notifyOnOrderUpdates: boolean;
  notifyOnNewProducts: boolean;
}

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  enableScreenReader: boolean;
  showKeyboardShortcuts: boolean;
}

export interface PreferencesStore {
  // Appearance
  theme: Theme;
  currency: Currency;
  language: Language;
  
  // Product viewing
  productView: ProductViewPreferences;
  
  // Search
  search: SearchPreferences;
  
  // Notifications
  notifications: NotificationPreferences;
  
  // Accessibility
  accessibility: AccessibilityPreferences;
  
  // Recently viewed products
  recentlyViewed: string[];
  maxRecentlyViewed: number;
  
  // Favorite categories
  favoriteCategories: string[];
  
  // UI state
  sidebarCollapsed: boolean;
  cookieConsent: boolean | null;
  onboardingCompleted: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  
  // Product view actions
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  setItemsPerPage: (count: number) => void;
  updateProductViewPreferences: (preferences: Partial<ProductViewPreferences>) => void;
  
  // Search actions
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
  updateSearchPreferences: (preferences: Partial<SearchPreferences>) => void;
  
  // Notification actions
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  
  // Accessibility actions
  updateAccessibilityPreferences: (preferences: Partial<AccessibilityPreferences>) => void;
  
  // Recently viewed actions
  addRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
  
  // Category actions
  addFavoriteCategory: (category: string) => void;
  removeFavoriteCategory: (category: string) => void;
  
  // UI actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCookieConsent: (consent: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  
  // Bulk actions
  resetToDefaults: () => void;
  importPreferences: (preferences: Partial<PreferencesStore>) => void;
  exportPreferences: () => Partial<PreferencesStore>;
}

// =============================================
// DEFAULT VALUES
// =============================================

const defaultProductViewPreferences: ProductViewPreferences = {
  viewMode: 'grid',
  sortBy: 'featured',
  itemsPerPage: 20,
  showOutOfStock: true,
  showComparePrice: true,
  enableQuickView: true,
};

const defaultSearchPreferences: SearchPreferences = {
  recentSearches: [],
  maxRecentSearches: 10,
  enableSearchSuggestions: true,
  enableAutoComplete: true,
  saveSearchHistory: true,
};

const defaultNotificationPreferences: NotificationPreferences = {
  enablePushNotifications: false,
  enableEmailNotifications: false,
  notifyOnPriceDrops: false,
  notifyOnBackInStock: false,
  notifyOnOrderUpdates: true,
  notifyOnNewProducts: false,
};

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  fontSize: 'medium',
  enableScreenReader: false,
  showKeyboardShortcuts: false,
};

// =============================================
// PREFERENCES STORE
// =============================================

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      theme: 'system',
      currency: 'USD',
      language: 'en',
      
      productView: defaultProductViewPreferences,
      search: defaultSearchPreferences,
      notifications: defaultNotificationPreferences,
      accessibility: defaultAccessibilityPreferences,
      
      recentlyViewed: [],
      maxRecentlyViewed: 20,
      favoriteCategories: [],
      
      sidebarCollapsed: false,
      cookieConsent: null,
      onboardingCompleted: false,
      
      // Appearance actions
      setTheme: (theme) => {
        set((draft) => {
          draft.theme = theme;
        });
        
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        }
      },
      
      setCurrency: (currency) => {
        set((draft) => {
          draft.currency = currency;
        });
      },
      
      setLanguage: (language) => {
        set((draft) => {
          draft.language = language;
        });
        
        // Update document language
        document.documentElement.lang = language;
      },
      
      // Product view actions
      setViewMode: (mode) => {
        set((draft) => {
          draft.productView.viewMode = mode;
        });
      },
      
      setSortBy: (sort) => {
        set((draft) => {
          draft.productView.sortBy = sort;
        });
      },
      
      setItemsPerPage: (count) => {
        set((draft) => {
          draft.productView.itemsPerPage = Math.max(10, Math.min(100, count));
        });
      },
      
      updateProductViewPreferences: (preferences) => {
        set((draft) => {
          draft.productView = { ...draft.productView, ...preferences };
        });
      },
      
      // Search actions
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        
        set((draft) => {
          const searches = draft.search.recentSearches;
          const index = searches.indexOf(query);
          
          if (index > -1) {
            searches.splice(index, 1);
          }
          
          searches.unshift(query);
          
          if (searches.length > draft.search.maxRecentSearches) {
            searches.splice(draft.search.maxRecentSearches);
          }
        });
      },
      
      clearRecentSearches: () => {
        set((draft) => {
          draft.search.recentSearches = [];
        });
      },
      
      removeRecentSearch: (query) => {
        set((draft) => {
          const index = draft.search.recentSearches.indexOf(query);
          if (index > -1) {
            draft.search.recentSearches.splice(index, 1);
          }
        });
      },
      
      updateSearchPreferences: (preferences) => {
        set((draft) => {
          draft.search = { ...draft.search, ...preferences };
        });
      },
      
      // Notification actions
      updateNotificationPreferences: (preferences) => {
        set((draft) => {
          draft.notifications = { ...draft.notifications, ...preferences };
        });
      },
      
      // Accessibility actions
      updateAccessibilityPreferences: (preferences) => {
        set((draft) => {
          draft.accessibility = { ...draft.accessibility, ...preferences };
        });
        
        // Apply accessibility settings to DOM
        const root = document.documentElement;
        const { reduceMotion, highContrast, fontSize } = { ...get().accessibility, ...preferences };
        
        root.classList.toggle('reduce-motion', reduceMotion);
        root.classList.toggle('high-contrast', highContrast);
        root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xl');
        root.classList.add(`font-size-${fontSize}`);
      },
      
      // Recently viewed actions
      addRecentlyViewed: (productId) => {
        set((draft) => {
          const index = draft.recentlyViewed.indexOf(productId);
          
          if (index > -1) {
            draft.recentlyViewed.splice(index, 1);
          }
          
          draft.recentlyViewed.unshift(productId);
          
          if (draft.recentlyViewed.length > draft.maxRecentlyViewed) {
            draft.recentlyViewed.splice(draft.maxRecentlyViewed);
          }
        });
      },
      
      clearRecentlyViewed: () => {
        set((draft) => {
          draft.recentlyViewed = [];
        });
      },
      
      // Category actions
      addFavoriteCategory: (category) => {
        set((draft) => {
          if (!draft.favoriteCategories.includes(category)) {
            draft.favoriteCategories.push(category);
          }
        });
      },
      
      removeFavoriteCategory: (category) => {
        set((draft) => {
          const index = draft.favoriteCategories.indexOf(category);
          if (index > -1) {
            draft.favoriteCategories.splice(index, 1);
          }
        });
      },
      
      // UI actions
      setSidebarCollapsed: (collapsed) => {
        set((draft) => {
          draft.sidebarCollapsed = collapsed;
        });
      },
      
      setCookieConsent: (consent) => {
        set((draft) => {
          draft.cookieConsent = consent;
        });
      },
      
      setOnboardingCompleted: (completed) => {
        set((draft) => {
          draft.onboardingCompleted = completed;
        });
      },
      
      // Bulk actions
      resetToDefaults: () => {
        set((draft) => {
          draft.productView = defaultProductViewPreferences;
          draft.search = defaultSearchPreferences;
          draft.notifications = defaultNotificationPreferences;
          draft.accessibility = defaultAccessibilityPreferences;
          draft.theme = 'system';
          draft.currency = 'USD';
          draft.language = 'en';
          draft.recentlyViewed = [];
          draft.favoriteCategories = [];
          draft.sidebarCollapsed = false;
        });
      },
      
      importPreferences: (preferences) => {
        set((draft) => {
          Object.assign(draft, preferences);
        });
      },
      
      exportPreferences: () => {
        const state = get();
        return {
          theme: state.theme,
          currency: state.currency,
          language: state.language,
          productView: state.productView,
          search: state.search,
          notifications: state.notifications,
          accessibility: state.accessibility,
          favoriteCategories: state.favoriteCategories,
        };
      },
    })),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      // Exclude some temporary state from persistence
      partialize: (state) => ({
        ...state,
        // Don't persist recently viewed (privacy concern)
        recentlyViewed: [],
      }),
    }
  )
);

// =============================================
// PREFERENCE HOOKS
// =============================================

// Theme hook
export const useTheme = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  return { theme, setTheme };
};

// View mode hook
export const useViewMode = () => {
  const viewMode = usePreferencesStore((state) => state.productView.viewMode);
  const setViewMode = usePreferencesStore((state) => state.setViewMode);
  return { viewMode, setViewMode };
};

// Sort preference hook
export const useSortPreference = () => {
  const sortBy = usePreferencesStore((state) => state.productView.sortBy);
  const setSortBy = usePreferencesStore((state) => state.setSortBy);
  return { sortBy, setSortBy };
};

// Currency hook
export const useCurrency = () => {
  const currency = usePreferencesStore((state) => state.currency);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);
  return { currency, setCurrency };
};

// Recent searches hook
export const useRecentSearches = () => {
  const recentSearches = usePreferencesStore((state) => state.search.recentSearches);
  const addRecentSearch = usePreferencesStore((state) => state.addRecentSearch);
  const clearRecentSearches = usePreferencesStore((state) => state.clearRecentSearches);
  const removeRecentSearch = usePreferencesStore((state) => state.removeRecentSearch);
  
  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
};

// Recently viewed hook
export const useRecentlyViewed = () => {
  const recentlyViewed = usePreferencesStore((state) => state.recentlyViewed);
  const addRecentlyViewed = usePreferencesStore((state) => state.addRecentlyViewed);
  const clearRecentlyViewed = usePreferencesStore((state) => state.clearRecentlyViewed);
  
  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
};

// Accessibility hook
export const useAccessibilityPreferences = () => {
  const accessibility = usePreferencesStore((state) => state.accessibility);
  const updateAccessibilityPreferences = usePreferencesStore((state) => state.updateAccessibilityPreferences);
  
  return {
    accessibility,
    updateAccessibilityPreferences,
  };
};

// =============================================
// PREFERENCE UTILITIES
// =============================================

// Format price according to currency preference
export const formatPrice = (amount: number, currency: Currency = 'USD'): string => {
  const formatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    LBP: new Intl.NumberFormat('ar-LB', { style: 'currency', currency: 'LBP' }),
    EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
  };
  
  return formatters[currency]?.format(amount) || `$${amount.toFixed(2)}`;
};

// Get sort function based on preference
export const getSortFunction = (sortBy: SortOption) => {
  const sortFunctions = {
    name: (a: any, b: any) => a.name.localeCompare(b.name),
    'price-low': (a: any, b: any) => a.price - b.price,
    'price-high': (a: any, b: any) => b.price - a.price,
    newest: (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    rating: (a: any, b: any) => (b.rating || 0) - (a.rating || 0),
    featured: (a: any, b: any) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    },
  };
  
  return sortFunctions[sortBy] || sortFunctions.featured;
};

export default usePreferencesStore;