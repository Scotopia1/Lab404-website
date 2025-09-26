import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellRing,
  ShoppingCart,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Package,
  X,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Truck,
  Calendar,
  User,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket, OrderNotification } from '@/contexts/WebSocketContext';

interface NotificationDashboardProps {
  className?: string;
}

export const NotificationDashboard: React.FC<NotificationDashboardProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearAllNotifications
  } = useWebSocket();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<OrderNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        className={`fixed top-4 right-4 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          variant="default"
          size="lg"
          className="relative shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 mr-2 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 mr-2" />
          )}
          Notifications
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`fixed top-4 right-4 z-50 w-96 ${className}`}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Order Notifications</CardTitle>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 p-0"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time order notifications for immediate processing {isConnected ? '(Connected)' : '(Disconnected)'}
          </CardDescription>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {notifications.filter(n => !n.read).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="self-start"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                className="self-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <AnimatePresence>
              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No unread notifications</p>
                  <p className="text-sm">New order alerts will appear here</p>
                </div>
              ) : (
                notifications.filter(n => !n.read).map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    } ${notification.urgent ? 'border-l-4 border-l-red-500' : ''}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-sm">
                            #{notification.orderNumber}
                          </span>
                          {notification.urgent && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              Urgent
                            </Badge>
                          )}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{notification.customerName}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getPaymentMethodIcon(notification.paymentMethod)}
                            <span>${notification.totalAmount.toFixed(2)}</span>
                            <span>•</span>
                            <span>{notification.itemCount} items</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detailed Notification Modal */}
      {selectedNotification && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedNotification(null)}
        >
          <motion.div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Order #{selectedNotification.orderNumber}
                  {selectedNotification.urgent && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedNotification.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedNotification.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedNotification.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(selectedNotification.paymentMethod)}
                      <span>{selectedNotification.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Items
                  </h3>
                  <div className="space-y-2">
                    {selectedNotification.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="font-semibold">
                          ${item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 font-semibold text-lg">
                      <span>Total:</span>
                      <span>${selectedNotification.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h3>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    {selectedNotification.shippingAddress.fullAddress}
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                  </h3>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Estimated: {selectedNotification.estimatedDelivery.displayText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>Contact: {selectedNotification.shippingAddress.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedNotification.notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Order Notes</h3>
                    <div className="text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      {selectedNotification.notes}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send WhatsApp
                  </Button>
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Processed
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationDashboard;