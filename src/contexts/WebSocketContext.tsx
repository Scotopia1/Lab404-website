import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { TokenManager } from '@/api/client';
import { toast } from 'sonner';

interface OrderNotification {
  id: string;
  type: 'new_order' | 'order_status_update';
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress: {
    fullAddress: string;
    phone: string;
  };
  notes?: string;
  estimatedDelivery: {
    minDate: string;
    maxDate: string;
    displayText: string;
  };
  status?: string; // For status update notifications
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: OrderNotification[];
  unreadCount: number;
  addNotification: (notification: OrderNotification) => void;
  markAsRead: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  markAllAsRead: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Initialize WebSocket connection for admin users
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return;
    }

    // Get token directly from TokenManager
    const token = TokenManager.getAccessToken();
    if (!token) {
      console.log('🔐 No access token found, skipping WebSocket connection');
      return;
    }

    console.log('🔌 Initializing WebSocket connection for admin user:', user.email);

    const newSocket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000'}/admin`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to admin WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from admin WebSocket:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('🎉 WebSocket connection confirmed:', data);
      toast.success('Connected to real-time notifications');
    });

    // Notification event handlers
    newSocket.on('notification:new_order', (notification: OrderNotification) => {
      console.log('🛒 New order notification received:', notification);

      addNotification(notification);

      // Show toast notification
      toast.success('New Order Received!', {
        description: `Order ${notification.orderNumber} - $${notification.totalAmount.toFixed(2)}`,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to order details - we'll implement this later
            console.log('Navigate to order:', notification.orderId);
          }
        }
      });

      // Play notification sound if browser supports it
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAAAAAA=');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        // Ignore audio errors
      }
    });

    newSocket.on('notification:order_status', (notification: OrderNotification) => {
      console.log('📦 Order status update received:', notification);

      addNotification(notification);

      toast.info('Order Status Updated', {
        description: `Order ${notification.orderNumber} - ${notification.status}`
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // Add notification to the list
  const addNotification = (notification: OrderNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep only last 100
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    // Emit to server
    if (socket) {
      socket.emit('notification:read', notificationId);
    }
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    // Emit to server
    if (socket) {
      socket.emit('notification:delete', notificationId);
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    markAllAsRead,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export type { OrderNotification };
export default WebSocketContext;