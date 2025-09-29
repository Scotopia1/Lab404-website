import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from './cartStore';
import { apiClient } from '../api/client';
// DISABLED: Legacy Supabase realtime - Using Socket.IO instead via WebSocketContext
// import { realtimeManager, subscribeToUserCart } from '../lib/realtime';

// =============================================
// TYPES
// =============================================

export interface SyncConfiguration {
  enableCartSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  conflictResolution: 'local' | 'remote' | 'merge';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  hasConflicts: boolean;
}

// =============================================
// SYNC MANAGER CLASS
// =============================================

class StateSyncManager {
  private config: SyncConfiguration;
  private status: SyncStatus;
  private syncTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private retryCounters: Map<string, number> = new Map();

  constructor(config: Partial<SyncConfiguration> = {}) {
    this.config = {
      enableCartSync: true,
      syncInterval: 5000, // 5 seconds
      maxRetries: 3,
      conflictResolution: 'merge',
      ...config,
    };

    this.status = {
      isOnline: navigator.onLine,
      lastSyncAt: null,
      pendingChanges: 0,
      syncInProgress: false,
      hasConflicts: false,
    };

    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.pauseSync();
    });
  }

  // =============================================
  // CART SYNCHRONIZATION
  // =============================================

  async syncCart(userId: string) {
    if (!this.config.enableCartSync || this.status.syncInProgress) {
      return;
    }

    try {
      this.status.syncInProgress = true;
      
      const cartStore = useCartStore.getState();
      const localItems = cartStore.items;
      
      // Load remote cart items
      const remoteCartData = await apiClient.getCart();
      const remoteItems = remoteCartData?.items || [];

      // Sync logic based on conflict resolution strategy
      const syncedItems = await this.resolveCartConflicts(localItems, remoteItems);
      
      // Update local cart with synced items
      if (JSON.stringify(localItems) !== JSON.stringify(syncedItems)) {
        // Clear and repopulate cart
        await cartStore.clearCart();
        
        for (const item of syncedItems) {
          await cartStore.addItem(item.productId, item.quantity);
        }
      }

      this.status.lastSyncAt = new Date().toISOString();
      this.retryCounters.delete('cart');
      
    } catch (error) {
      console.error('Cart sync failed:', error);
      await this.handleSyncError('cart', error);
    } finally {
      this.status.syncInProgress = false;
    }
  }

  private async resolveCartConflicts(localItems: any[], remoteItems: any[]) {
    switch (this.config.conflictResolution) {
      case 'local':
        return localItems;
      
      case 'remote':
        return remoteItems;
      
      case 'merge':
      default:
        // Merge strategy: keep items with latest timestamp
        const mergedItems = new Map();
        
        // Process local items
        for (const item of localItems) {
          mergedItems.set(item.productId, {
            ...item,
            source: 'local',
            timestamp: new Date(item.addedAt).getTime(),
          });
        }
        
        // Process remote items
        for (const item of remoteItems) {
          const existing = mergedItems.get(item.product_id);
          const remoteTimestamp = new Date(item.created_at).getTime();
          
          if (!existing || remoteTimestamp > existing.timestamp) {
            mergedItems.set(item.product_id, {
              id: item.id,
              productId: item.product_id,
              quantity: item.quantity,
              addedAt: item.created_at,
              source: 'remote',
              timestamp: remoteTimestamp,
            });
          }
        }
        
        return Array.from(mergedItems.values());
    }
  }


  // =============================================
  // ERROR HANDLING & RETRY LOGIC
  // =============================================

  private async handleSyncError(type: string, error: any) {
    const retryCount = this.retryCounters.get(type) || 0;
    
    if (retryCount < this.config.maxRetries) {
      this.retryCounters.set(type, retryCount + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(() => {
        if (type === 'cart') {
          // Retry cart sync
          console.log(`Retrying cart sync (attempt ${retryCount + 1})`);
        }
      }, delay);
    } else {
      console.error(`Max retries exceeded for ${type} sync:`, error);
      this.status.hasConflicts = true;
    }
  }

  // =============================================
  // SYNC CONTROL
  // =============================================

  startPeriodicSync(userId: string) {
    this.stopPeriodicSync();
    
    if (!this.status.isOnline) {
      return;
    }

    const syncInterval = setInterval(async () => {
      if (this.status.isOnline && !this.status.syncInProgress) {
        await this.syncCart(userId);
      }
    }, this.config.syncInterval);

    this.syncTimeouts.set('periodic', syncInterval as any);
  }

  stopPeriodicSync() {
    const timeout = this.syncTimeouts.get('periodic');
    if (timeout) {
      clearInterval(timeout);
      this.syncTimeouts.delete('periodic');
    }
  }

  pauseSync() {
    this.stopPeriodicSync();
    console.log('Sync paused due to offline status');
  }

  resumeSync() {
    console.log('Sync resumed - back online');
    // Trigger immediate sync when coming back online
    // The periodic sync will be restarted by the hook
  }

  // =============================================
  // STATUS & CONFIGURATION
  // =============================================

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  updateConfiguration(config: Partial<SyncConfiguration>) {
    this.config = { ...this.config, ...config };
  }

  async forceSyncAll(userId: string) {
    if (!userId) return;
    
    await this.syncCart(userId);
  }

  clearConflicts() {
    this.status.hasConflicts = false;
    this.retryCounters.clear();
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

export const syncManager = new StateSyncManager();

// =============================================
// REACT HOOK FOR SYNC MANAGEMENT
// =============================================

export const useSyncManager = () => {
  const { user } = useAuth();
  const syncManagerRef = useRef(syncManager);
  
  useEffect(() => {
    if (user?.id) {
      // Start periodic sync for authenticated users
      syncManagerRef.current.startPeriodicSync(user.id);
      
      // Perform initial sync
      syncManagerRef.current.forceSyncAll(user.id);
      
      return () => {
        syncManagerRef.current.stopPeriodicSync();
      };
    } else {
      // Stop sync for unauthenticated users
      syncManagerRef.current.stopPeriodicSync();
    }
  }, [user?.id]);

  return {
    syncManager: syncManagerRef.current,
    status: syncManagerRef.current.getStatus(),
    forceSyncAll: () => user?.id && syncManagerRef.current.forceSyncAll(user.id),
    clearConflicts: () => syncManagerRef.current.clearConflicts(),
  };
};

// =============================================
// REAL-TIME SYNC HOOKS
// =============================================

// DISABLED: Legacy Supabase realtime hook - Using Socket.IO instead via WebSocketContext
// This hook was causing 1000+ error logs trying to connect to non-existent Supabase project
/*
export const useRealtimeCartSync = () => {
  const { user } = useAuth();
  const cartStore = useCartStore();

  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToUserCart(user.id, {
      onItemAdded: (item) => {
        console.log('Real-time cart item added:', item);
        // Handle real-time cart updates
      },

      onItemUpdated: (item) => {
        console.log('Real-time cart item updated:', item);
        // Handle real-time cart updates
      },

      onItemRemoved: (itemId) => {
        console.log('Real-time cart item removed:', itemId);
        // Handle real-time cart updates
      },

      onError: (error) => {
        console.error('Real-time cart sync error:', error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);
};
*/

// Placeholder hook to prevent breaking imports
export const useRealtimeCartSync = () => {
  // No-op: Real-time cart sync now handled by Socket.IO in WebSocketContext
  console.log('⚠️ useRealtimeCartSync is deprecated - using Socket.IO instead');
};

// =============================================
// STORE INTEGRATION
// =============================================

// Enhanced cart store with sync capabilities (for use in React components only)
export const enhanceCartWithSync = (userId?: string) => {
  // This function should only be called from React components where useAuth is available
  // For initialization, we don't enhance during store setup
  
  if (!userId) return; // Can't enhance without user context
  
  // Override cart actions to trigger sync
  const originalAddItem = useCartStore.getState().addItem;
  const originalUpdateQuantity = useCartStore.getState().updateQuantity;
  const originalRemoveItem = useCartStore.getState().removeItem;
  const originalClearCart = useCartStore.getState().clearCart;
  
  useCartStore.setState({
    addItem: async (...args) => {
      await originalAddItem(...args);
      await syncManager.syncCart(userId);
    },
    
    updateQuantity: async (...args) => {
      await originalUpdateQuantity(...args);
      await syncManager.syncCart(userId);
    },
    
    removeItem: async (...args) => {
      await originalRemoveItem(...args);
      await syncManager.syncCart(userId);
    },
    
    clearCart: async (...args) => {
      await originalClearCart(...args);
      await syncManager.syncCart(userId);
    },
  });
};

export default syncManager;