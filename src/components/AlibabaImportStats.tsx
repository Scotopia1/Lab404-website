import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Package, Clock, CheckCircle, XCircle,
  Calendar, DollarSign, RefreshCw, Download, Eye
} from 'lucide-react';
import { contentImportManager } from '@/lib/alibaba/ContentImportManager';

const AlibabaImportStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    successRate: '0',
    recentImports: 0,
    lastImportAt: null as string | null
  });

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const importStats = contentImportManager.getImportStats();
    const importHistory = contentImportManager.getImportHistory();

    setStats(importStats);
    setHistory(importHistory);
  };

  const getRecentStats = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent24h = history.filter(record => new Date(record.importedAt) > oneDayAgo);
    const recent7d = history.filter(record => new Date(record.importedAt) > oneWeekAgo);
    const recent30d = history.filter(record => new Date(record.importedAt) > oneMonthAgo);

    return {
      last24h: {
        total: recent24h.length,
        successful: recent24h.filter(r => r.success).length,
        failed: recent24h.filter(r => !r.success).length
      },
      last7d: {
        total: recent7d.length,
        successful: recent7d.filter(r => r.success).length,
        failed: recent7d.filter(r => !r.success).length
      },
      last30d: {
        total: recent30d.length,
        successful: recent30d.filter(r => r.success).length,
        failed: recent30d.filter(r => !r.success).length
      }
    };
  };

  const getTopCategories = () => {
    const categoryCount: Record<string, number> = {};

    history.forEach(record => {
      if (record.success && record.options?.category) {
        categoryCount[record.options.category] = (categoryCount[record.options.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  };

  const getHourlyDistribution = () => {
    const hourlyCount = new Array(24).fill(0);

    history.forEach(record => {
      const hour = new Date(record.importedAt).getHours();
      hourlyCount[hour]++;
    });

    const maxCount = Math.max(...hourlyCount);

    return hourlyCount.map((count, hour) => ({
      hour,
      count,
      percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
    }));
  };

  const recentStats = getRecentStats();
  const topCategories = getTopCategories();
  const hourlyDistribution = getHourlyDistribution();

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import Statistics</h3>
        <Button variant="outline" onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Imports</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{recentStats.last24h.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Success</span>
                <Badge className="bg-green-100 text-green-700">{recentStats.last24h.successful}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Failed</span>
                <Badge variant="destructive">{recentStats.last24h.failed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{recentStats.last7d.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Success</span>
                <Badge className="bg-green-100 text-green-700">{recentStats.last7d.successful}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Failed</span>
                <Badge variant="destructive">{recentStats.last7d.failed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{recentStats.last30d.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Success</span>
                <Badge className="bg-green-100 text-green-700">{recentStats.last30d.successful}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Failed</span>
                <Badge variant="destructive">{recentStats.last30d.failed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Import Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map(({ category, count }, index) => {
                const percentage = stats.successful > 0 ? (count / stats.successful) * 100 : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{count} imports</span>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <BarChart3 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p>No category data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Activity by Hour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Import Activity by Hour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {hourlyDistribution.map(({ hour, count, percentage }) => (
              <div key={hour} className="text-center">
                <div
                  className="bg-blue-200 rounded mb-1 mx-auto transition-all hover:bg-blue-300"
                  style={{
                    height: `${Math.max(percentage * 0.5, 4)}px`,
                    width: '100%'
                  }}
                  title={`${hour}:00 - ${count} imports`}
                />
                <span className="text-xs text-gray-500">{hour}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Import activity distribution across 24 hours
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Last Import Info */}
      {stats.lastImportAt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Last Import Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last import was on</p>
                <p className="font-medium">
                  {new Date(stats.lastImportAt).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">
                {Math.floor((Date.now() - new Date(stats.lastImportAt).getTime()) / (1000 * 60 * 60))} hours ago
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Stats
        </Button>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View Detailed Report
        </Button>
      </div>

      {/* Empty State */}
      {stats.total === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Import Data</h3>
            <p className="text-gray-500 mb-4">
              Start importing products from Alibaba to see detailed statistics and insights.
            </p>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Start Importing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlibabaImportStats;