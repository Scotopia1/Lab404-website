import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpIcon,
  ArrowDownIcon,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Timer,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth?: number;
    growthRate: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    featured: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    total_revenue: number;
    average_order_value: number;
    orders_today: number;
    revenue_today: number;
  };
  categories?: {
    total: number;
    active: number;
    withProducts: number;
    rootCategories: number;
  };
}

interface DashboardAnalytics {
  overview: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
    revenue_growth: number;
    order_growth: number;
    customer_growth: number;
  };
  recent_activity: {
    recent_orders: any[];
    recent_customers: any[];
    low_stock_products: any[];
  };
  sales_trends: {
    daily_sales: Array<{ date: string; revenue: number; orders: number }>;
    monthly_sales: Array<{ month: string; revenue: number; orders: number }>;
  };
  top_performers: {
    top_products: Array<{ product_id: string; product_name: string; revenue: number; quantity_sold: number }>;
    top_categories: Array<{ category: string; revenue: number; order_count: number }>;
  };
}

interface RecentActivity {
  id: string;
  type: 'user' | 'product' | 'order' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface QuickStat {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds default
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(10);

  // Countdown timer for next refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return refreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Update last updated time on successful queries
  const onQuerySuccess = useCallback(() => {
    setLastUpdated(new Date());
    setNextRefreshIn(refreshInterval / 1000);
  }, [refreshInterval]);

  // Fetch dashboard statistics (basic stats)
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.getAdminStats(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000, // Data is fresh for 5 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
    refetchOnWindowFocus: false,
    onSuccess: onQuerySuccess,
  });

  // Fetch comprehensive dashboard analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
    error: analyticsError,
  } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard-analytics'],
    queryFn: () => apiClient.getDashboardAnalytics(30), // 30 days
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
    onSuccess: onQuerySuccess,
  });

  // Recent activity from real order data
  const recentActivity: RecentActivity[] = analytics?.recent_activity?.recent_orders?.slice(0, 5)?.map((order: any) => ({
    id: order.id,
    type: 'order' as const,
    title: `New Order #${order.id.substring(0, 8)}`,
    description: `${order.user_name || order.guest_email || 'Guest'} - $${order.total_amount}`,
    timestamp: new Date(order.created_at).toLocaleString(),
    status: order.status === 'pending' ? 'warning' : order.status === 'delivered' ? 'success' : 'info',
  })) || [];

  const activityLoading = analyticsLoading;

  const isAnyFetching = statsFetching || analyticsFetching;

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchAnalytics()]);
      toast.success('Dashboard refreshed');
      setLastUpdated(new Date());
      setNextRefreshIn(refreshInterval / 1000);
    } catch (error) {
      toast.error('Failed to refresh dashboard');
      console.error('Dashboard refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats, refetchAnalytics, refreshInterval]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      toast.info(newValue ? 'Auto-refresh enabled' : 'Auto-refresh disabled');
      if (newValue) {
        setNextRefreshIn(refreshInterval / 1000);
      }
      return newValue;
    });
  }, [refreshInterval]);

  // Error retry function
  const handleRetry = async () => {
    toast.info('Retrying connection...');
    await handleRefresh();
  };

  // Error boundary component
  const ErrorDisplay = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="text-sm text-red-600 mb-4">
            Unable to load dashboard data. Please check your connection and try again.
          </p>
          <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Quick stats configuration with enhanced analytics
  const quickStats: QuickStat[] = useMemo(() => [
    {
      title: 'Total Users',
      value: (analytics?.overview?.total_customers || stats?.users.total || 0).toLocaleString(),
      change: analytics?.overview?.customer_growth
        ? `${analytics.overview.customer_growth > 0 ? '+' : ''}${analytics.overview.customer_growth.toFixed(1)}% growth`
        : `${stats?.users.active || 0} active`,
      changeType: (analytics?.overview?.customer_growth || 0) > 0 ? 'positive' :
                  (analytics?.overview?.customer_growth || 0) < 0 ? 'negative' : 'neutral',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Products',
      value: (analytics?.overview?.total_products || stats?.products.active || 0).toLocaleString(),
      change: `${stats?.products.lowStock || 0} low stock`,
      changeType: (stats?.products.lowStock || 0) > 0 ? 'negative' : 'positive',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: (analytics?.overview?.total_orders || stats?.orders.total || 0).toLocaleString(),
      change: analytics?.overview?.order_growth
        ? `${analytics.overview.order_growth > 0 ? '+' : ''}${analytics.overview.order_growth.toFixed(1)}% growth`
        : `${stats?.orders.pending || 0} pending`,
      changeType: (analytics?.overview?.order_growth || 0) > 0 ? 'positive' :
                  (analytics?.overview?.order_growth || 0) < 0 ? 'negative' : 'neutral',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue',
      value: `$${(analytics?.overview?.total_revenue || stats?.orders.total_revenue || 0).toLocaleString()}`,
      change: analytics?.overview?.revenue_growth
        ? `${analytics.overview.revenue_growth > 0 ? '+' : ''}${analytics.overview.revenue_growth.toFixed(1)}% growth`
        : `$${(stats?.orders.revenue_today || 0).toLocaleString()} today`,
      changeType: (analytics?.overview?.revenue_growth || 0) > 0 ? 'positive' :
                  (analytics?.overview?.revenue_growth || 0) < 0 ? 'negative' : 'neutral',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ], [analytics, stats]);

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'user': return Users;
      case 'product': return Package;
      case 'order': return ShoppingCart;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                statsError || analyticsError ? 'bg-red-500' :
                statsLoading || analyticsLoading ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {statsError || analyticsError ? 'Connection Error' :
                 statsLoading || analyticsLoading ? 'Loading...' :
                 `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>
            {autoRefresh && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-refresh: {refreshInterval / 1000}s
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Auto-refresh controls */}
          <div className="flex items-center space-x-2">
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10000">10s</SelectItem>
                <SelectItem value="30000">30s</SelectItem>
                <SelectItem value="60000">1m</SelectItem>
                <SelectItem value="300000">5m</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {(statsError && analyticsError) && (
        <ErrorDisplay error={statsError || analyticsError} onRetry={handleRetry} />
      )}

      {/* Partial Error Warning */}
      {(statsError || analyticsError) && !(statsError && analyticsError) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Partial Data Loading Issue
                </p>
                <p className="text-xs text-yellow-600">
                  Some dashboard data may be outdated. {statsError ? 'Basic stats unavailable.' : 'Analytics unavailable.'}
                </p>
              </div>
              <Button onClick={handleRetry} size="sm" variant="outline" className="ml-auto border-yellow-300 text-yellow-700">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading || analyticsLoading ? (
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : statsError || analyticsError ? (
                    <div className="text-red-500 text-lg">--</div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {stat.changeType === 'positive' && <ArrowUpIcon className="h-3 w-3 text-green-600" />}
                  {stat.changeType === 'negative' && <ArrowDownIcon className="h-3 w-3 text-red-600" />}
                  <p className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Business Insights and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Business Insights</span>
            </CardTitle>
            <CardDescription>Key performance metrics and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="font-medium">${(stats?.orders.average_order_value || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orders Today</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {stats?.orders.orders_today || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Today</span>
                  <span className="font-medium text-green-600">${(stats?.orders.revenue_today || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Stock Products</span>
                  <span className={`font-medium ${(stats?.products.lowStock || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats?.products.lowStock || 0}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Top Performers</span>
            </CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics?.top_performers?.top_products?.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {analytics.top_performers.top_products.slice(0, 5).map((product: any, index: number) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={product.product_name}>
                          {product.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity_sold} sold
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      ${product.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type, activity.status);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3"
                    >
                      <div className={`p-1.5 rounded-full ${getStatusColor(activity.status)}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/products/new')}
            >
              <Package className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Add Product</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingCart className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">View Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/admin/analytics')}
            >
              <Eye className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Business Alerts</span>
          </CardTitle>
          <CardDescription>Important notifications and action items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Low Stock Alert */}
            {stats?.products.lowStock && stats.products.lowStock > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Low Stock Alert</span>
                </div>
                <span className="text-sm text-yellow-700">
                  {stats.products.lowStock} products running low
                </span>
              </div>
            )}

            {/* Out of Stock Alert */}
            {stats?.products.outOfStock && stats.products.outOfStock > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Out of Stock</span>
                </div>
                <span className="text-sm text-red-700">
                  {stats.products.outOfStock} products out of stock
                </span>
              </div>
            )}

            {/* Pending Orders Alert */}
            {stats?.orders.pending && stats.orders.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Pending Orders</span>
                </div>
                <span className="text-sm text-blue-700">
                  {stats.orders.pending} orders need attention
                </span>
              </div>
            )}

            {/* Growth Trend Alert */}
            {analytics?.overview?.revenue_growth && analytics.overview.revenue_growth < -10 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Revenue Decline</span>
                </div>
                <span className="text-sm text-orange-700">
                  {analytics.overview.revenue_growth.toFixed(1)}% decline this period
                </span>
              </div>
            )}

            {/* Low Stock Products List */}
            {analytics?.recent_activity?.low_stock_products?.length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">Low Stock Products</span>
                </div>
                <div className="space-y-1">
                  {analytics.recent_activity.low_stock_products.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="text-xs text-gray-600 flex justify-between">
                      <span className="truncate max-w-[200px]">{product.name}</span>
                      <span className="text-red-600 font-medium">{product.stock_quantity} left</span>
                    </div>
                  ))}
                  {analytics.recent_activity.low_stock_products.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{analytics.recent_activity.low_stock_products.length - 3} more products
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Good State */}
            {(!stats?.products.lowStock && !stats?.products.outOfStock && !stats?.orders.pending) && (
              <div className="text-center text-gray-500 py-4">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-green-600 font-medium">All systems running smoothly!</p>
                <p className="text-xs text-gray-500 mt-1">No urgent action items</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};