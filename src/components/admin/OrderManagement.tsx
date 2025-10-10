import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  DollarSign,
  Truck,
  Package,
  RefreshCw,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Download,
  Settings,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Calculator,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { ManualOrderCreation } from './ManualOrderCreation';

// Interfaces
interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  user_name?: string;
  user_email?: string;
  guest_email?: string;
  guest_name?: string;
  guest_phone?: string;
  payment_method?: 'cash_on_delivery' | 'whatsapp' | 'stripe' | 'paypal';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  items_count?: number;
  item_count?: number;
  shipping_address: any;
  billing_address?: any;
  notes?: string;
  whatsapp_sent: boolean;
  whatsapp_number?: string;
  tracking_number?: string;
  refund_amount?: number;
  estimated_delivery_min?: string;
  estimated_delivery_max?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_today: number;
  revenue_today: number;
  pending_payment: number;
}

export const OrderManagement: React.FC = () => {
  // State management
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 10,
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showManualOrderCreation, setShowManualOrderCreation] = useState(false);

  const queryClient = useQueryClient();

  // Fetch order statistics
  const {
    data: orderStats,
    isLoading: statsLoading,
  } = useQuery<OrderStats>({
    queryKey: ['order-stats'],
    queryFn: () => apiClient.getOrderStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch orders with filtering
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => apiClient.getAdminOrders({
      ...filters,
      offset: (filters.page! - 1) * filters.limit!,
    }),
    keepPreviousData: true,
    onError: (error) => {
      console.error('Error fetching orders:', error);
    },
  });

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateAdminOrder(id, data),
    onSuccess: () => {
      toast.success('Order updated successfully');
      queryClient.invalidateQueries(['admin-orders']);
      queryClient.invalidateQueries(['order-stats']);
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update order';
      toast.error(errorMessage);
    },
  });

  const refundOrderMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) => apiClient.processRefund(id, amount),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries(['admin-orders']);
      queryClient.invalidateQueries(['order-stats']);
      setShowRefundDialog(false);
      setRefundAmount('');
    },
    onError: () => toast.error('Failed to process refund'),
  });

  const markWhatsAppSentMutation = useMutation({
    mutationFn: (id: string) => apiClient.markWhatsAppSent(id),
    onSuccess: () => {
      toast.success('WhatsApp status updated');
      queryClient.invalidateQueries(['admin-orders']);
    },
    onError: () => toast.error('Failed to update WhatsApp status'),
  });

  // Computed values with data mapping
  const rawOrders = ordersData?.orders || [];
  const orders = rawOrders.map((order: any) => ({
    ...order,
    customer_name: order.customer_name || order.user_name || order.guest_email?.split('@')[0] || 'Guest',
    customer_email: order.customer_email || order.user_email || order.guest_email || 'N/A',
    items_count: order.items_count || order.item_count || 0,
    order_number: order.order_number || `ORD-${order.id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}`
  }));
  const totalOrders = ordersData?.total || 0;
  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(totalOrders / (filters.limit || 10));

  // Debug logging
  console.log('OrderManagement Debug:', {
    ordersData,
    ordersLoading,
    ordersError,
    orders,
    filters
  });

  // Handlers
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when filters change
    }));
  };

  const handleSort = (sortBy: string) => {
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'asc' ? 'desc' : 'asc';
    handleFilterChange('sort_by', sortBy);
    handleFilterChange('sort_order', newSortOrder);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o: Order) => o.id));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ id: orderId, data: { status } });
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const orderDetails = await apiClient.getAdminOrder(order.id);
      setSelectedOrder(orderDetails);
      setShowOrderDetails(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const handleRefundOrder = (order: Order) => {
    setSelectedOrder(order);
    setRefundAmount(order.total_amount.toString());
    setShowRefundDialog(true);
  };

  const handleProcessRefund = () => {
    if (!selectedOrder) return;
    const amount = refundAmount ? Number(refundAmount) : undefined;
    refundOrderMutation.mutate({ id: selectedOrder.id, amount });
  };

  const handleSendWhatsApp = (orderId: string) => {
    markWhatsAppSentMutation.mutate(orderId);
  };

  // WhatsApp Call Customer
  const handleCallCustomer = (order: Order) => {
    const phoneNumber = order.customer_phone?.replace(/\D/g, '') || ''; // Remove non-digits
    if (!phoneNumber) {
      toast.error('No phone number available');
      return;
    }
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`Calling ${order.customer_name} via WhatsApp`);
  };

  // WhatsApp Chat Customer
  const handleChatCustomer = (order: Order) => {
    const phoneNumber = order.customer_phone?.replace(/\D/g, '') || ''; // Remove non-digits
    if (!phoneNumber) {
      toast.error('No phone number available');
      return;
    }
    const message = `Hello ${order.customer_name}, this is LAB404 Electronics regarding your order #${order.order_number}. How can we help you today?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp chat with ${order.customer_name}`);
  };

  // Proceed to next order status
  const handleProceedOrder = (order: Order) => {
    const statusProgression = {
      'pending': 'confirmed',
      'confirmed': 'processing',
      'processing': 'shipped',
      'shipped': 'delivered'
    };

    const nextStatus = statusProgression[order.status as keyof typeof statusProgression];

    if (nextStatus) {
      handleUpdateOrderStatus(order.id, nextStatus);
      toast.success(`Order ${order.order_number} moved to ${nextStatus}`);
    } else {
      toast.info(`Order ${order.order_number} is already at final status`);
    }
  };

  const refreshData = () => {
    refetchOrders();
    queryClient.invalidateQueries(['order-stats']);
  };

  // Get status badge color and text
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; color: string }> = {
      pending: { variant: 'secondary', color: 'text-gray-600' },
      confirmed: { variant: 'default', color: 'text-blue-600' },
      processing: { variant: 'default', color: 'text-blue-600' },
      shipped: { variant: 'outline', color: 'text-purple-600' },
      delivered: { variant: 'outline', color: 'text-green-600' },
      cancelled: { variant: 'destructive', color: 'text-red-600' },
      refunded: { variant: 'outline', color: 'text-orange-600' },
    };

    const config = statusMap[status] || statusMap.pending;
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; color: string }> = {
      pending: { variant: 'secondary', color: 'text-yellow-600' },
      paid: { variant: 'outline', color: 'text-green-600' },
      failed: { variant: 'destructive', color: 'text-red-600' },
      refunded: { variant: 'outline', color: 'text-orange-600' },
      partial: { variant: 'outline', color: 'text-orange-600' },
    };

    const config = statusMap[status] || statusMap.pending;
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return null;

    const methodMap: Record<string, { variant: any; color: string; icon: any; label: string }> = {
      cash_on_delivery: { variant: 'outline', color: 'text-green-600 border-green-200', icon: Truck, label: 'COD' },
      whatsapp: { variant: 'outline', color: 'text-blue-600 border-blue-200', icon: MessageCircle, label: 'WhatsApp' },
      stripe: { variant: 'outline', color: 'text-purple-600 border-purple-200', icon: CreditCard, label: 'Stripe' },
      paypal: { variant: 'outline', color: 'text-orange-600 border-orange-200', icon: CreditCard, label: 'PayPal' },
    };

    const config = methodMap[method];
    if (!config) return null;

    const IconComponent = config.icon;
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Format customer info for display
  const formatCustomerInfo = (order: Order) => {
    // For COD orders, prioritize guest information
    if (order.payment_method === 'cash_on_delivery') {
      return {
        name: order.guest_name || order.customer_name || order.user_name || 'Guest Customer',
        email: order.guest_email || order.customer_email || order.user_email || 'N/A',
        phone: order.guest_phone || order.customer_phone || 'N/A',
        isGuest: true
      };
    }

    // For other orders, use standard customer info
    return {
      name: order.customer_name || order.user_name || order.guest_name || 'Customer',
      email: order.customer_email || order.user_email || order.guest_email || 'N/A',
      phone: order.customer_phone || order.guest_phone || 'N/A',
      isGuest: !order.user_name && !order.user_email
    };
  };

  // Format delivery estimate
  const formatDeliveryEstimate = (order: Order) => {
    if (order.estimated_delivery_min && order.estimated_delivery_max) {
      const minDate = new Date(order.estimated_delivery_min).toLocaleDateString();
      const maxDate = new Date(order.estimated_delivery_max).toLocaleDateString();
      return `${minDate} - ${maxDate}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage customer orders, shipping, and fulfillment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowManualOrderCreation(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{orderStats?.total_orders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ${(orderStats?.total_revenue || 0).toLocaleString()} total revenue
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-yellow-600">{orderStats?.pending_orders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting processing
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{orderStats?.orders_today || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ${(orderStats?.revenue_today || 0).toLocaleString()} revenue
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    ${(orderStats?.average_order_value || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per order average
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage customer orders and track fulfillment status
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by number, customer name, email..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.payment_status || 'all'}
                onValueChange={(value) => handleFilterChange('payment_status', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900"
              >
                <div className="space-y-2">
                  <Label htmlFor="date_from">From Date</Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_to">To Date</Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">Results per page</Label>
                  <Select
                    value={filters.limit?.toString() || '10'}
                    onValueChange={(value) => handleFilterChange('limit', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </div>

          {/* Orders Table */}
          {ordersError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Orders</h3>
              <p className="text-gray-600 mb-6">
                There was an error loading the orders. Please try again.
              </p>
              <Button onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('order_number')}
                    >
                      <div className="flex items-center">
                        Order #
                        {filters.sort_by === 'order_number' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center">
                        Total
                        {filters.sort_by === 'total_amount' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Date
                        {filters.sort_by === 'created_at' && (
                          filters.sort_order === 'desc' ? <SortDesc className="ml-1 h-4 w-4" /> : <SortAsc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                        <p className="text-gray-600">
                          {filters.search ? 'No orders match your search criteria.' : 'No orders have been placed yet.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order: Order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">#{order.order_number}</div>
                          <div className="text-sm text-gray-500">{order.items_count} items</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatCustomerInfo(order).name}</span>
                              {formatCustomerInfo(order).isGuest && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  Guest
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{formatCustomerInfo(order).email}</div>
                            {formatCustomerInfo(order).phone !== 'N/A' && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatCustomerInfo(order).phone}
                              </div>
                            )}
                            {formatDeliveryEstimate(order) && (
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDeliveryEstimate(order)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPaymentStatusBadge(order.payment_status)}
                            {order.whatsapp_sent && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp Sent
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentMethodBadge(order.payment_method)}</TableCell>
                        <TableCell>
                          <div className="font-medium">${order.total_amount.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendWhatsApp(order.id)}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {order.whatsapp_sent ? 'Mark WhatsApp Sent' : 'Send WhatsApp'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'processing')}>
                                <Package className="h-4 w-4 mr-2" />
                                Mark Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>
                                <Truck className="h-4 w-4 mr-2" />
                                Mark Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Delivered
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRefundOrder(order)}
                                className="text-red-600"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Process Refund
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * (filters.limit || 10) + 1} to {Math.min(currentPage * (filters.limit || 10), totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete order information and management
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Number:</span>
                        <span className="font-medium">#{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment:</span>
                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="font-medium">${selectedOrder.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Customer Information
                      {formatCustomerInfo(selectedOrder).isGuest && (
                        <Badge variant="secondary" className="text-xs">
                          Guest Order
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{formatCustomerInfo(selectedOrder).name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{formatCustomerInfo(selectedOrder).email}</span>
                      </div>
                      {formatCustomerInfo(selectedOrder).phone !== 'N/A' && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{formatCustomerInfo(selectedOrder).phone}</span>
                        </div>
                      )}
                      {selectedOrder.payment_method && (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          {getPaymentMethodBadge(selectedOrder.payment_method)}
                        </div>
                      )}
                      {formatDeliveryEstimate(selectedOrder) && (
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span>Est. Delivery: {formatDeliveryEstimate(selectedOrder)}</span>
                        </div>
                      )}
                      {selectedOrder.whatsapp_sent && (
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-green-400" />
                          <span className="text-green-600">WhatsApp notification sent</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item: OrderItem) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {item.product_image && (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{item.product_name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Shipping & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {typeof selectedOrder.shipping_address === 'string'
                      ? selectedOrder.shipping_address
                      : selectedOrder.shipping_address?.address_line_1 || 'Address not provided'
                    }
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Order Notes
                    </h3>
                    <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Order Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                  {selectedOrder.subtotal && (
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.shipping_amount && selectedOrder.shipping_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shipping_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {selectedOrder.tracking_number && (
                <div>
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span>Tracking Number: {selectedOrder.tracking_number}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3">
            <div className="flex gap-2 mr-auto">
              <Button
                variant="outline"
                onClick={() => handleCallCustomer(selectedOrder!)}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                disabled={!selectedOrder}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                onClick={() => handleChatCustomer(selectedOrder!)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                disabled={!selectedOrder}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                onClick={() => handleProceedOrder(selectedOrder!)}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                variant="outline"
                disabled={!selectedOrder}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Proceed
              </Button>
            </div>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for order #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="refund_amount">Refund Amount</Label>
              <Input
                id="refund_amount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
              />
              <p className="text-sm text-gray-500 mt-1">
                Original order total: ${selectedOrder?.total_amount.toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessRefund}
              disabled={refundOrderMutation.isLoading}
            >
              {refundOrderMutation.isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Order Creation Dialog */}
      <ManualOrderCreation
        isOpen={showManualOrderCreation}
        onClose={() => setShowManualOrderCreation(false)}
        onOrderCreated={(orderId) => {
          // Refresh data and optionally navigate to the new order
          refreshData();
          toast.success('Order created successfully!');
        }}
      />
    </div>
  );
};
