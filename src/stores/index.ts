// =============================================
// STORE EXPORTS
// =============================================

// Cart Store
export {
  useCartStore,
  useCartSummary,
  useCartCount,
  useIsInCart,
  useCartQuantity,
  useCartLoading,
  useCartError,
  selectCartItem,
  selectCartItemsByCategory,
  formatPrice as formatCartPrice,
  formatCartForWhatsApp,
} from './cartStore';

export type {
  CartItem,
  CartSummary,
  CartStore,
} from './cartStore';

// Preferences Store
export {
  usePreferencesStore,
  useTheme,
  useViewMode,
  useSortPreference,
  useCurrency,
  useRecentSearches,
  useRecentlyViewed,
  useAccessibilityPreferences,
  formatPrice as formatPreferencePrice,
  getSortFunction,
} from './preferencesStore';

export type {
  ViewMode,
  SortOption,
  Theme,
  Currency,
  Language,
  ProductViewPreferences,
  SearchPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  PreferencesStore,
} from './preferencesStore';


// Sync Manager
export {
  syncManager,
  useSyncManager,
  useRealtimeCartSync,
} from './syncManager';

export type {
  SyncConfiguration,
  SyncStatus,
} from './syncManager';

// =============================================
// STORE INITIALIZATION
// =============================================

import { useCartStore } from './cartStore';
import { usePreferencesStore } from './preferencesStore';

// Initialize stores with proper configuration
export const initializeStores = () => {
  console.log('Initializing Zustand stores...');
  
  // Initialize preferences store and apply settings
  const preferencesState = usePreferencesStore.getState();
  
  // Apply theme
  preferencesState.setTheme(preferencesState.theme);
  
  // Apply accessibility settings
  preferencesState.updateAccessibilityPreferences(preferencesState.accessibility);
  
  // Apply language
  preferencesState.setLanguage(preferencesState.language);
  
  // Note: Store sync enhancement happens in StoreProvider component
  // where hooks are available in React context
  
  console.log('✅ Stores initialized successfully');
  
  // Return store states for debugging
  return {
    cart: useCartStore.getState(),
    preferences: usePreferencesStore.getState(),
  };
};

// =============================================
// STORE UTILITIES
// =============================================

// Reset all stores to default state
export const resetAllStores = () => {
  useCartStore.getState().clearCart();
  usePreferencesStore.getState().resetToDefaults();
};

// Export store states for debugging
export const getStoreStates = () => ({
  cart: useCartStore.getState(),
  preferences: usePreferencesStore.getState(),
});

// Store health check
export const checkStoreHealth = () => {
  const cartStore = useCartStore.getState();
  const preferencesStore = usePreferencesStore.getState();
  
  return {
    cart: {
      healthy: !cartStore.error,
      itemCount: cartStore.items.length,
      error: cartStore.error,
    },
    preferences: {
      healthy: true, // Preferences store doesn't have error states
      theme: preferencesStore.theme,
      currency: preferencesStore.currency,
    },
  };
};

// =============================================
// DEVTOOLS INTEGRATION
// =============================================

// Development helper to inspect store states
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__LAB404_STORES__ = {
    cart: useCartStore,
    preferences: usePreferencesStore,
    getStates: getStoreStates,
    reset: resetAllStores,
    healthCheck: checkStoreHealth,
  };
  
  console.log('🛠️ Store devtools available at window.__LAB404_STORES__');
}

export default {
  cart: useCartStore,
  preferences: usePreferencesStore,
  initialize: initializeStores,
  reset: resetAllStores,
  healthCheck: checkStoreHealth,
};