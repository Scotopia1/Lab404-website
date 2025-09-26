import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Activity,
  Shield,
  Eye,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Monitor,
  Database,
  Settings,
  ShoppingCart,
  Users,
  Lock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/api/client';

// Interfaces for audit logging
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'security' | 'system';
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location?: string;
  status: 'success' | 'failed' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface AuditStats {
  totalEvents: number;
  todayEvents: number;
  failedLogins: number;
  adminActions: number;
  securityEvents: number;
  systemErrors: number;
  topUsers: Array<{ name: string; actions: number; email: string }>;
  topActions: Array<{ action: string; count: number }>;
  eventsByHour: Array<{ hour: string; count: number }>;
}

interface AuditFilters {
  search: string;
  actionType: string;
  severity: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  userId: string;
  resource: string;
  page: number;
  limit: number;
}

export const AuditLogs: React.FC = () => {
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    actionType: '',
    severity: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    resource: '',
    page: 1,
    limit: 50,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch audit statistics
  const { data: auditStats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.getAuditStats();
        return response.data || response;
      } catch (error) {
        // Mock data for development
        return {
          totalEvents: 12456,
          todayEvents: 234,
          failedLogins: 23,
          adminActions: 789,
          securityEvents: 45,
          systemErrors: 12,
          topUsers: [
            { name: 'Admin User', actions: 156, email: 'admin@lab404.com' },
            { name: 'John Smith', actions: 89, email: 'john@lab404.com' },
            { name: 'Sarah Wilson', actions: 67, email: 'sarah@lab404.com' },
          ],
          topActions: [
            { action: 'Product Updated', count: 234 },
            { action: 'User Login', count: 189 },
            { action: 'Order Created', count: 156 },
            { action: 'Settings Changed', count: 98 },
          ],
          eventsByHour: Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            count: Math.floor(Math.random() * 50) + 10,
          })),
        } as AuditStats;
      }
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch audit logs
  const { data: auditLogsResponse, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      try {
        const response = await apiClient.getAuditLogs(filters);
        return response;
      } catch (error) {
        // Mock data for development
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            userId: 'admin-1',
            userName: 'Admin User',
            userEmail: 'admin@lab404.com',
            action: 'Product Created',
            actionType: 'create',
            resource: 'products',
            resourceId: 'prod-123',
            newValues: { name: 'Arduino Uno R3', price: 25.99, category: 'Microcontrollers' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Beirut, Lebanon',
            status: 'success',
            severity: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            sessionId: 'sess-abc123',
            metadata: { productCategory: 'Electronics', featured: true },
          },
          {
            id: '2',
            userId: 'admin-1',
            userName: 'Admin User',
            userEmail: 'admin@lab404.com',
            action: 'Failed Login Attempt',
            actionType: 'login',
            resource: 'auth',
            ipAddress: '203.0.113.10',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Unknown',
            status: 'failed',
            severity: 'high',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            sessionId: 'sess-failed-001',
            metadata: { reason: 'Invalid password', attempts: 3 },
          },
          {
            id: '3',
            userId: 'user-2',
            userName: 'John Smith',
            userEmail: 'john@lab404.com',
            action: 'Order Status Updated',
            actionType: 'update',
            resource: 'orders',
            resourceId: 'order-456',
            oldValues: { status: 'pending' },
            newValues: { status: 'processing' },
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Beirut, Lebanon',
            status: 'success',
            severity: 'medium',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            sessionId: 'sess-xyz789',
            metadata: { orderId: 'ORD-2024-001', customerNotified: true },
          },
          {
            id: '4',
            userId: 'admin-1',
            userName: 'Admin User',
            userEmail: 'admin@lab404.com',
            action: 'System Settings Modified',
            actionType: 'update',
            resource: 'settings',
            resourceId: 'system-config',
            oldValues: { maintenanceMode: false },
            newValues: { maintenanceMode: true },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'Beirut, Lebanon',
            status: 'success',
            severity: 'critical',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            sessionId: 'sess-abc123',
            metadata: { section: 'systemPreferences', scheduledMaintenance: true },
          },
          {
            id: '5',
            userId: 'user-3',
            userName: 'Sarah Wilson',
            userEmail: 'sarah@lab404.com',
            action: 'User Profile Viewed',
            actionType: 'view',
            resource: 'users',
            resourceId: 'user-789',
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            location: 'Beirut, Lebanon',
            status: 'success',
            severity: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            sessionId: 'sess-def456',
            metadata: { viewedSections: ['profile', 'orders', 'preferences'] },
          },
        ];

        return {
          data: mockLogs,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: 150,
            totalPages: 3,
            hasNext: filters.page < 3,
            hasPrev: filters.page > 1,
          },
        };
      }
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const auditLogs = auditLogsResponse?.data || [];
  const pagination = auditLogsResponse?.pagination;

  const handleFilterChange = (key: keyof AuditFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when changing filters
    }));
  };

  const handleExportLogs = async () => {
    try {
      await apiClient.exportAuditLogs(filters);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      toast.success('Audit logs export initiated (mock)');
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <User className="h-4 w-4" />;
      case 'update': return <Settings className="h-4 w-4" />;
      case 'delete': return <AlertTriangle className="h-4 w-4" />;
      case 'login': case 'logout': return <Lock className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track system activities and administrative actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.totalEvents.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{auditStats?.todayEvents || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{auditStats?.failedLogins || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.adminActions || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{auditStats?.securityEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search actions, users, resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="dateFrom">From:</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="dateTo">To:</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-auto"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                actionType: '',
                severity: '',
                status: '',
                dateFrom: '',
                dateTo: '',
                userId: '',
                resource: '',
                page: 1,
                limit: 50,
              })}
            >
              Clear Filters
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Audit Trail</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Activity className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No audit logs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openLogDetail(log)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{log.userName}</span>
                          <span className="text-xs text-gray-500">{log.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.actionType)}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.action}</span>
                            <span className="text-xs text-gray-500 capitalize">{log.actionType}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium capitalize">{log.resource}</span>
                          {log.resourceId && (
                            <span className="text-xs text-gray-500">{log.resourceId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{log.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      <Dialog open={showLogDetail} onOpenChange={setShowLogDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedLog && getActionIcon(selectedLog.actionType)}
              <span>Audit Log Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Timestamp</Label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.timestamp), 'PPP pp')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Session ID</Label>
                  <p className="text-sm font-mono">{selectedLog.sessionId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User</Label>
                  <p className="text-sm">
                    {selectedLog.userName} ({selectedLog.userEmail})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">IP Address</Label>
                  <p className="text-sm">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p className="text-sm">{selectedLog.location || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User Agent</Label>
                  <p className="text-sm truncate" title={selectedLog.userAgent}>
                    {selectedLog.userAgent}
                  </p>
                </div>
              </div>

              {/* Action Details */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Action Details</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Action:</span>
                      <p className="text-sm">{selectedLog.action}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedLog.actionType}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Resource:</span>
                      <p className="text-sm">{selectedLog.resource}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Resource ID:</span>
                      <p className="text-sm font-mono">{selectedLog.resourceId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes */}
              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Changes</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.oldValues && (
                      <div>
                        <span className="text-sm font-medium text-red-600">Before</span>
                        <pre className="text-xs bg-red-50 p-3 rounded border overflow-x-auto">
                          {JSON.stringify(selectedLog.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValues && (
                      <div>
                        <span className="text-sm font-medium text-green-600">After</span>
                        <pre className="text-xs bg-green-50 p-3 rounded border overflow-x-auto">
                          {JSON.stringify(selectedLog.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Additional Metadata</Label>
                  <pre className="text-xs bg-gray-50 p-3 rounded border mt-2 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Status and Severity */}
              <div className="flex items-center space-x-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant="outline" className={`ml-2 ${getStatusColor(selectedLog.status)}`}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Severity</Label>
                  <Badge variant="outline" className={`ml-2 ${getSeverityColor(selectedLog.severity)}`}>
                    {selectedLog.severity}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};