import { supabase } from './supabase';
import type { Database } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// =============================================
// TYPES FOR REALTIME EVENTS
// =============================================

export type TableName = keyof Database['public']['Tables'];

export type RealtimePayload<T extends TableName> = RealtimePostgresChangesPayload<{
  [K in T]: Database['public']['Tables'][K]['Row'];
}>;

export type ChangeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeCallbacks<T extends TableName> {
  onInsert?: (payload: RealtimePayload<T>) => void;
  onUpdate?: (payload: RealtimePayload<T>) => void;
  onDelete?: (payload: RealtimePayload<T>) => void;
  onError?: (error: any) => void;
}

// =============================================
// REALTIME MANAGER CLASS
// =============================================

class RealtimeManager {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private isConnected = false;

  constructor() {
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    // Modern Supabase v2 doesn't expose direct connection handlers
    // Connection status is managed internally by the client
    // We'll track connection status through subscription success/failure
    this.isConnected = true; // Assume connected initially
    console.log('✅ Realtime manager initialized');
  }

  /**
   * Subscribe to changes on a specific table
   */
  subscribeToTable<T extends TableName>(
    tableName: T,
    callbacks: RealtimeCallbacks<T>,
    filter?: string
  ): RealtimeSubscription {
    const channelName = filter ? `${tableName}:${filter}` : tableName;
    
    // Unsubscribe existing subscription if exists
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload: any) => {
          try {
            switch (payload.eventType) {
              case 'INSERT':
                callbacks.onInsert?.(payload);
                break;
              case 'UPDATE':
                callbacks.onUpdate?.(payload);
                break;
              case 'DELETE':
                callbacks.onDelete?.(payload);
                break;
            }
          } catch (error) {
            console.error(`Error handling ${payload.eventType} event for ${tableName}:`, error);
            callbacks.onError?.(error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log(`✅ Subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          console.error(`❌ Failed to subscribe to ${channelName}`);
          callbacks.onError?.(new Error(`Failed to subscribe to ${channelName}`));
        }
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName),
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to changes on a specific row
   */
  subscribeToRow<T extends TableName>(
    tableName: T,
    id: string,
    callbacks: RealtimeCallbacks<T>
  ): RealtimeSubscription {
    return this.subscribeToTable(
      tableName,
      callbacks,
      `id=eq.${id}`
    );
  }

  /**
   * Subscribe to user-specific data
   */
  subscribeToUserData<T extends TableName>(
    tableName: T,
    userId: string,
    callbacks: RealtimeCallbacks<T>
  ): RealtimeSubscription {
    return this.subscribeToTable(
      tableName,
      callbacks,
      `user_id=eq.${userId}`
    );
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(channelName);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, channelName) => {
      subscription.channel.unsubscribe();
      console.log(`🔌 Unsubscribed from ${channelName}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get list of active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager();

// =============================================
// SPECIFIC SUBSCRIPTION HELPERS
// =============================================

/**
 * Subscribe to product changes
 */
export const subscribeToProducts = (callbacks: {
  onProductAdded?: (product: Database['public']['Tables']['products']['Row']) => void;
  onProductUpdated?: (product: Database['public']['Tables']['products']['Row']) => void;
  onProductDeleted?: (productId: string) => void;
  onError?: (error: any) => void;
}) => {
  return realtimeManager.subscribeToTable('products', {
    onInsert: (payload) => {
      if (payload.new) {
        callbacks.onProductAdded?.(payload.new as Database['public']['Tables']['products']['Row']);
      }
    },
    onUpdate: (payload) => {
      if (payload.new) {
        callbacks.onProductUpdated?.(payload.new as Database['public']['Tables']['products']['Row']);
      }
    },
    onDelete: (payload) => {
      if (payload.old) {
        callbacks.onProductDeleted?.(payload.old.id);
      }
    },
    onError: callbacks.onError,
  });
};

/**
 * Subscribe to cart changes for a user
 */
export const subscribeToUserCart = (
  userId: string,
  callbacks: {
    onItemAdded?: (item: Database['public']['Tables']['cart_items']['Row']) => void;
    onItemUpdated?: (item: Database['public']['Tables']['cart_items']['Row']) => void;
    onItemRemoved?: (itemId: string) => void;
    onError?: (error: any) => void;
  }
) => {
  return realtimeManager.subscribeToUserData('cart_items', userId, {
    onInsert: (payload) => {
      if (payload.new) {
        callbacks.onItemAdded?.(payload.new as Database['public']['Tables']['cart_items']['Row']);
      }
    },
    onUpdate: (payload) => {
      if (payload.new) {
        callbacks.onItemUpdated?.(payload.new as Database['public']['Tables']['cart_items']['Row']);
      }
    },
    onDelete: (payload) => {
      if (payload.old) {
        callbacks.onItemRemoved?.(payload.old.id);
      }
    },
    onError: callbacks.onError,
  });
};

/**
 * Subscribe to order status changes for a user
 */
export const subscribeToUserOrders = (
  userId: string,
  callbacks: {
    onOrderCreated?: (order: Database['public']['Tables']['orders']['Row']) => void;
    onOrderUpdated?: (order: Database['public']['Tables']['orders']['Row']) => void;
    onStatusChanged?: (orderId: string, newStatus: string) => void;
    onError?: (error: any) => void;
  }
) => {
  return realtimeManager.subscribeToUserData('orders', userId, {
    onInsert: (payload) => {
      if (payload.new) {
        callbacks.onOrderCreated?.(payload.new as Database['public']['Tables']['orders']['Row']);
      }
    },
    onUpdate: (payload) => {
      if (payload.new && payload.old) {
        const newOrder = payload.new as Database['public']['Tables']['orders']['Row'];
        const oldOrder = payload.old;
        
        callbacks.onOrderUpdated?.(newOrder);
        
        if (newOrder.status !== oldOrder.status) {
          callbacks.onStatusChanged?.(newOrder.id, newOrder.status);
        }
      }
    },
    onError: callbacks.onError,
  });
};

/**
 * Subscribe to inventory changes
 */
export const subscribeToInventory = (callbacks: {
  onStockChanged?: (productId: string, newStock: number, inStock: boolean) => void;
  onLowStock?: (productId: string, currentStock: number, threshold: number) => void;
  onError?: (error: any) => void;
}) => {
  return realtimeManager.subscribeToTable('products', {
    onUpdate: (payload) => {
      if (payload.new && payload.old) {
        const newProduct = payload.new as Database['public']['Tables']['products']['Row'];
        const oldProduct = payload.old;
        
        // Check for stock quantity changes
        if (newProduct.stock_quantity !== oldProduct.stock_quantity || 
            newProduct.in_stock !== oldProduct.in_stock) {
          callbacks.onStockChanged?.(
            newProduct.id,
            newProduct.stock_quantity,
            newProduct.in_stock
          );
          
          // Check for low stock alerts
          if (newProduct.track_inventory && 
              newProduct.stock_quantity <= newProduct.low_stock_threshold &&
              newProduct.stock_quantity > 0) {
            callbacks.onLowStock?.(
              newProduct.id,
              newProduct.stock_quantity,
              newProduct.low_stock_threshold
            );
          }
        }
      }
    },
    onError: callbacks.onError,
  });
};

/**
 * Subscribe to new reviews
 */
export const subscribeToProductReviews = (
  productId: string,
  callbacks: {
    onReviewAdded?: (review: Database['public']['Tables']['reviews']['Row']) => void;
    onReviewUpdated?: (review: Database['public']['Tables']['reviews']['Row']) => void;
    onReviewApproved?: (review: Database['public']['Tables']['reviews']['Row']) => void;
    onError?: (error: any) => void;
  }
) => {
  return realtimeManager.subscribeToTable('reviews', {
    onInsert: (payload) => {
      if (payload.new && payload.new.product_id === productId) {
        callbacks.onReviewAdded?.(payload.new as Database['public']['Tables']['reviews']['Row']);
      }
    },
    onUpdate: (payload) => {
      if (payload.new && payload.old && payload.new.product_id === productId) {
        const newReview = payload.new as Database['public']['Tables']['reviews']['Row'];
        const oldReview = payload.old;
        
        callbacks.onReviewUpdated?.(newReview);
        
        if (!oldReview.is_approved && newReview.is_approved) {
          callbacks.onReviewApproved?.(newReview);
        }
      }
    },
    onError: callbacks.onError,
  }, `product_id=eq.${productId}`);
};

/**
 * Subscribe to user profile changes
 */
export const subscribeToUserProfile = (
  userId: string,
  callbacks: {
    onProfileUpdated?: (profile: Database['public']['Tables']['profiles']['Row']) => void;
    onError?: (error: any) => void;
  }
) => {
  return realtimeManager.subscribeToRow('profiles', userId, {
    onUpdate: (payload) => {
      if (payload.new) {
        callbacks.onProfileUpdated?.(payload.new as Database['public']['Tables']['profiles']['Row']);
      }
    },
    onError: callbacks.onError,
  });
};

// =============================================
// REACT HOOKS FOR REALTIME DATA
// =============================================

import { useEffect, useRef } from 'react';

/**
 * Hook to subscribe to realtime changes and automatically cleanup
 */
export const useRealtimeSubscription = <T extends TableName>(
  tableName: T,
  callbacks: RealtimeCallbacks<T>,
  filter?: string,
  deps: any[] = []
) => {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    // Cleanup previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    subscriptionRef.current = realtimeManager.subscribeToTable(
      tableName,
      callbacks,
      filter
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [tableName, filter, ...deps]);

  return subscriptionRef.current;
};

/**
 * Hook to subscribe to user-specific realtime data
 */
export const useUserRealtimeSubscription = <T extends TableName>(
  tableName: T,
  userId: string | undefined,
  callbacks: RealtimeCallbacks<T>,
  deps: any[] = []
) => {
  return useRealtimeSubscription(
    tableName,
    callbacks,
    userId ? `user_id=eq.${userId}` : undefined,
    [userId, ...deps]
  );
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if realtime is available and connected
 */
export const isRealtimeAvailable = (): boolean => {
  return realtimeManager.getConnectionStatus();
};

/**
 * Get realtime connection info
 */
export const getRealtimeInfo = () => {
  return {
    isConnected: realtimeManager.getConnectionStatus(),
    activeChannels: realtimeManager.getActiveChannels(),
    subscriptionCount: realtimeManager.getActiveSubscriptionsCount(),
  };
};

/**
 * Force reconnection to realtime
 */
export const reconnectRealtime = () => {
  // Modern Supabase v2 handles reconnection automatically
  // We can unsubscribe and resubscribe all channels to force refresh
  console.log('🔄 Refreshing realtime connections...');
  realtimeManager.unsubscribeAll();
  // Subscriptions will be recreated when components remount or hooks run again
};

// =============================================
// EXPORT REALTIME MANAGER
// =============================================

export { realtimeManager as realtime };
export default realtimeManager;