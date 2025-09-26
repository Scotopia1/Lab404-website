import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Filter,
  Play,
  Pause,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Star,
  Clock,
  PieChart,
  LineChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

// Interfaces
interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  topProducts: TopProduct[];
  revenueByDay: RevenueData[];
  ordersByStatus: StatusData[];
  customersByMonth: CustomerData[];
  topCategories: CategoryData[];
  trafficSources: TrafficData[];
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
  image?: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface StatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerData {
  month: string;
  new_customers: number;
  returning_customers: number;
  total: number;
}

interface CategoryData {
  name: string;
  revenue: number;
  orders: number;
  growth: number;
}

interface TrafficData {
  source: string;
  visitors: number;
  percentage: number;
  color: string;
}

interface SalesAnalytics {
  daily: Array<{ date: string; sales: number; orders: number }>;
  weekly: Array<{ week: string; sales: number; orders: number }>;
  monthly: Array<{ month: string; sales: number; orders: number }>;
}

interface ProductAnalytics {
  topSelling: Array<{ name: string; quantity: number; revenue: number }>;
  categoryPerformance: Array<{ category: string; sales: number; growth: number }>;
  inventory: Array<{ product: string; stock: number; sold: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

export const Analytics: React.FC = () => {
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
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

  // Fetch analytics data
  const {
    data: dashboardAnalytics,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
    isSuccess: dashboardSuccess,
  } = useQuery({
    queryKey: ['dashboard-analytics', selectedPeriod],
    queryFn: () => apiClient.getDashboardAnalytics(Number(selectedPeriod)),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000, // Data is fresh for 5 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // React to successful dashboard query
  useEffect(() => {
    if (dashboardSuccess) {
      onQuerySuccess();
    }
  }, [dashboardSuccess, onQuerySuccess]);

  const {
    data: salesAnalytics,
    isLoading: salesLoading,
    isFetching: salesFetching,
    isSuccess: salesSuccess,
  } = useQuery<SalesAnalytics>({
    queryKey: ['sales-analytics', selectedPeriod],
    queryFn: () => apiClient.getSalesAnalytics(selectedPeriod),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
  });

  // React to successful sales query
  useEffect(() => {
    if (salesSuccess) {
      onQuerySuccess();
    }
  }, [salesSuccess, onQuerySuccess]);

  const {
    data: productAnalytics,
    isLoading: productLoading,
    isFetching: productFetching,
    isSuccess: productSuccess,
  } = useQuery<ProductAnalytics>({
    queryKey: ['product-analytics', selectedPeriod],
    queryFn: () => apiClient.getProductAnalytics(Number(selectedPeriod)),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
  });

  // React to successful product query
  useEffect(() => {
    if (productSuccess) {
      onQuerySuccess();
    }
  }, [productSuccess, onQuerySuccess]);

  const {
    data: orderAnalytics,
    isLoading: orderLoading,
    isFetching: orderFetching,
    isSuccess: orderSuccess,
  } = useQuery({
    queryKey: ['order-analytics'],
    queryFn: () => apiClient.getOrderAnalytics(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
  });

  // React to successful order query
  useEffect(() => {
    if (orderSuccess) {
      onQuerySuccess();
    }
  }, [orderSuccess, onQuerySuccess]);

  // Process real data from backend
  const analyticsData: AnalyticsData = useMemo(() => {
    // Extract dashboard data
    const dashboardOverview = dashboardAnalytics?.overview || {};
    const recentActivity = dashboardAnalytics?.recent_activity || {};
    const salesTrends = dashboardAnalytics?.sales_trends || {};
    const topPerformers = dashboardAnalytics?.top_performers || {};

    // Calculate average order value
    const avgOrderValue = dashboardOverview.total_orders > 0
      ? dashboardOverview.total_revenue / dashboardOverview.total_orders
      : 0;

    // Process top products data
    const topProducts = topPerformers.top_products?.map((product: any, index: number) => ({
      id: product.product_id || `product-${index}`,
      name: product.product_name || 'Unknown Product',
      sales: product.quantity_sold || 0,
      revenue: product.revenue || 0,
      growth: 0, // Growth calculation would need historical data
    })) || [];

    // Process revenue by day data
    const revenueByDay = salesTrends.daily_sales?.map((day: any) => ({
      date: day.date,
      revenue: day.revenue || 0,
      orders: day.orders || 0,
      customers: 0, // Not provided by current backend
    })) || [];

    // Process order status data (using recent orders to estimate status distribution)
    const recentOrders = recentActivity.recent_orders || [];
    const statusCounts = recentOrders.reduce((acc: any, order: any) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalRecentOrders = recentOrders.length;
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count,
      percentage: totalRecentOrders > 0 ? (count / totalRecentOrders) * 100 : 0,
      color: status === 'completed' ? '#10b981' :
             status === 'processing' ? '#3b82f6' :
             status === 'pending' ? '#f59e0b' :
             status === 'cancelled' ? '#ef4444' : '#8b5cf6',
    }));

    // Process monthly sales data for customer analysis
    const customersByMonth = salesTrends.monthly_sales?.map((month: any) => ({
      month: month.month?.split('-')[1] || 'Unknown',
      new_customers: Math.floor(month.orders * 0.6), // Estimated
      returning_customers: Math.floor(month.orders * 0.4), // Estimated
      total: month.orders || 0,
    })) || [];

    // Process top categories data
    const topCategories = topPerformers.top_categories?.map((category: any) => ({
      name: category.category || 'Unknown Category',
      revenue: category.revenue || 0,
      orders: category.order_count || 0,
      growth: 0, // Growth calculation would need historical data
    })) || [];

    // Mock traffic sources (not available in backend yet)
    const trafficSources = [
      { source: 'Direct', visitors: Math.floor(dashboardOverview.total_customers * 0.4), percentage: 40.0, color: '#8884d8' },
      { source: 'Search', visitors: Math.floor(dashboardOverview.total_customers * 0.3), percentage: 30.0, color: '#82ca9d' },
      { source: 'Social', visitors: Math.floor(dashboardOverview.total_customers * 0.2), percentage: 20.0, color: '#ffc658' },
      { source: 'Referral', visitors: Math.floor(dashboardOverview.total_customers * 0.1), percentage: 10.0, color: '#ff7300' },
    ];

    return {
      totalRevenue: dashboardOverview.total_revenue || 0,
      totalOrders: dashboardOverview.total_orders || 0,
      totalCustomers: dashboardOverview.total_customers || 0,
      averageOrderValue: avgOrderValue,
      conversionRate: 3.2, // Mock value - would need traffic data
      revenueGrowth: dashboardOverview.revenue_growth || 0,
      orderGrowth: dashboardOverview.order_growth || 0,
      customerGrowth: dashboardOverview.customer_growth || 0,
      topProducts,
      revenueByDay,
      ordersByStatus,
      customersByMonth,
      topCategories,
      trafficSources,
    };
  }, [dashboardAnalytics, salesAnalytics, productAnalytics, orderAnalytics]);

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        refetchDashboard(),
        // Add other refetch calls if needed
      ]);
      toast.success('Analytics data refreshed');
      setLastUpdated(new Date());
      setNextRefreshIn(refreshInterval / 1000);
    } catch (error) {
      toast.error('Failed to refresh analytics data');
    }
  }, [refetchDashboard, refreshInterval]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      toast.info(newValue ? 'Auto-refresh enabled' : 'Auto-refresh disabled');
      return newValue;
    });
  }, []);

  const isAnyFetching = dashboardFetching || salesFetching || productFetching || orderFetching;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            Analytics & Reports
            {isAnyFetching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="ml-3"
              >
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </motion.div>
            )}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>Comprehensive insights into sales, customers, and business performance</span>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              {autoRefresh && (
                <span className="text-blue-600">
                  • Next refresh in {nextRefreshIn}s
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">5 seconds</SelectItem>
              <SelectItem value="10000">10 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRefresh}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isAnyFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnyFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={`revenue-${analyticsData.totalRevenue}`}
        >
          <Card className={`relative overflow-hidden ${dashboardFetching ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
            {dashboardFetching && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className={`h-4 w-4 text-muted-foreground ${dashboardFetching ? 'text-blue-500' : ''}`} />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <motion.div
                  key={analyticsData.totalRevenue}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {analyticsData.revenueGrowth > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {formatPercentage(analyticsData.revenueGrowth)} from last period
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          key={`orders-${analyticsData.totalOrders}`}
        >
          <Card className={`relative overflow-hidden ${dashboardFetching ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
            {dashboardFetching && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className={`h-4 w-4 text-muted-foreground ${dashboardFetching ? 'text-green-500' : ''}`} />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <motion.div
                  key={analyticsData.totalOrders}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-2xl font-bold">{analyticsData.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {analyticsData.orderGrowth > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {formatPercentage(analyticsData.orderGrowth)} from last period
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          key={`customers-${analyticsData.totalCustomers}`}
        >
          <Card className={`relative overflow-hidden ${dashboardFetching ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
            {dashboardFetching && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className={`h-4 w-4 text-muted-foreground ${dashboardFetching ? 'text-purple-500' : ''}`} />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <motion.div
                  key={analyticsData.totalCustomers}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-2xl font-bold">{analyticsData.totalCustomers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {analyticsData.customerGrowth > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    {formatPercentage(analyticsData.customerGrowth)} from last period
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          key={`avg-order-${analyticsData.averageOrderValue}`}
        >
          <Card className={`relative overflow-hidden ${dashboardFetching ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}>
            {dashboardFetching && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" />
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Target className={`h-4 w-4 text-muted-foreground ${dashboardFetching ? 'text-orange-500' : ''}`} />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <motion.div
                  key={analyticsData.averageOrderValue}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-2xl font-bold">{formatCurrency(analyticsData.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData.conversionRate}% conversion rate
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Order Status
                </CardTitle>
                <CardDescription>Distribution of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                    <Legend />
                    <Pie
                      data={analyticsData.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                    >
                      {analyticsData.ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Top Products
                </CardTitle>
                <CardDescription>Best performing products this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          {product.growth > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          {formatPercentage(product.growth)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Traffic Sources
                </CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.trafficSources.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: source.color }}
                        ></div>
                        {source.source}
                      </span>
                      <span className="font-medium">{source.percentage}%</span>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Revenue and orders over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Revenue by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-500">{category.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.revenue)}</p>
                        <p className="text-sm text-gray-500">
                          {formatPercentage(category.growth)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Analytics</CardTitle>
                <CardDescription>Key product metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span>Total Products</span>
                    <Badge variant="outline">245</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Products</span>
                    <Badge variant="outline">198</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Low Stock Items</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Out of Stock</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
              <CardDescription>New vs returning customers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.customersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new_customers" stackId="a" fill="#8884d8" name="New Customers" />
                  <Bar dataKey="returning_customers" stackId="a" fill="#82ca9d" name="Returning Customers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};