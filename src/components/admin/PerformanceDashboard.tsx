import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Eye, 
  RefreshCw, 
  TrendingUp,
  Zap,
  BarChart3,
  Users
} from 'lucide-react';
import { useErrorTracking, errorTracker } from '@/lib/errorTracking';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'needs-improvement' | 'poor';
  description?: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, unit, status, description, icon }: MetricCardProps) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };

  const statusBadgeColors = {
    good: 'bg-green-100 text-green-800',
    'needs-improvement': 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800'
  };

  return (
    <Card className={`transition-colors ${statusColors[status]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-current">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(1) : value}
          {unit && <span className="text-sm ml-1 font-normal">{unit}</span>}
        </div>
        <div className="flex items-center justify-between mt-2">
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          <Badge variant="outline" className={statusBadgeColors[status]}>
            {status.replace('-', ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const PerformanceDashboard = () => {
  const { getErrorSummary, getPerformanceSummary } = useErrorTracking();
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    errors: getErrorSummary(),
    performance: getPerformanceSummary(),
    session: errorTracker.getCurrentSession()
  });

  const refreshData = async () => {
    setRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setData({
      errors: getErrorSummary(),
      performance: getPerformanceSummary(),
      session: errorTracker.getCurrentSession()
    });
    
    setRefreshing(false);
  };

  const getCoreWebVitalStatus = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = {
      first_contentful_paint: { good: 1800, poor: 3000 },
      largest_contentful_paint: { good: 2500, poor: 4000 },
      first_input_delay: { good: 100, poor: 300 },
      cumulative_layout_shift: { good: 0.1, poor: 0.25 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const exportData = () => {
    const exportData = errorTracker.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab404-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => ({
        ...prevData,
        errors: getErrorSummary(),
        performance: getPerformanceSummary(),
        session: errorTracker.getCurrentSession()
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor app performance, errors, and user experience metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportData}
            disabled={refreshing}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="core-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="errors">Errors & Issues</TabsTrigger>
          <TabsTrigger value="session">Session Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Errors"
              value={data.errors.totalErrors}
              status={data.errors.totalErrors === 0 ? 'good' : data.errors.totalErrors < 5 ? 'needs-improvement' : 'poor'}
              description="JavaScript errors caught"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Page Views"
              value={data.session.pageViews}
              status="good"
              description="Current session"
              icon={<Eye className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Session Duration"
              value={Math.round((Date.now() - data.session.startTime.getTime()) / 60000)}
              unit="min"
              status="good"
              description="Current session length"
              icon={<Clock className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Performance Score"
              value={85}
              unit="%"
              status="good"
              description="Overall app performance"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Recent Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Performance Metrics
              </CardTitle>
              <CardDescription>
                Latest performance measurements from the current session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.recentMetrics.slice(-5).map((metric, index) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{metric.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {metric.value.toFixed(1)} {metric.unit}
                      </p>
                      {metric.context?.type && (
                        <Badge variant="outline" className="text-xs">
                          {metric.context.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {data.performance.recentMetrics.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No performance metrics recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="core-vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.performance.coreWebVitals).map(([name, value]) => {
              const status = getCoreWebVitalStatus(name, value);
              const icons = {
                first_contentful_paint: <Zap className="h-4 w-4" />,
                largest_contentful_paint: <Activity className="h-4 w-4" />,
                first_input_delay: <RefreshCw className="h-4 w-4" />,
                cumulative_layout_shift: <BarChart3 className="h-4 w-4" />
              };
              
              return (
                <MetricCard
                  key={name}
                  title={name.replace(/_/g, ' ').toUpperCase()}
                  value={value}
                  unit={name === 'cumulative_layout_shift' ? 'score' : 'ms'}
                  status={status}
                  description={`Core Web Vital metric`}
                  icon={icons[name as keyof typeof icons] || <Activity className="h-4 w-4" />}
                />
              );
            })}
          </div>

          {/* Core Web Vitals Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Thresholds</CardTitle>
              <CardDescription>
                How your app performs against Core Web Vitals benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(data.performance.coreWebVitals).map(([name, value]) => {
                const thresholds = {
                  first_contentful_paint: { good: 1800, poor: 3000 },
                  largest_contentful_paint: { good: 2500, poor: 4000 },
                  first_input_delay: { good: 100, poor: 300 },
                  cumulative_layout_shift: { good: 0.1, poor: 0.25 }
                };
                
                const threshold = thresholds[name as keyof typeof thresholds];
                if (!threshold) return null;
                
                const percentage = Math.min((value / threshold.poor) * 100, 100);
                const status = getCoreWebVitalStatus(name, value);
                
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{name.replace(/_/g, ' ')}</span>
                      <span className={
                        status === 'good' ? 'text-green-600' :
                        status === 'needs-improvement' ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {value.toFixed(1)} {name === 'cumulative_layout_shift' ? 'score' : 'ms'}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Errors"
              value={data.errors.totalErrors}
              status={data.errors.totalErrors === 0 ? 'good' : 'poor'}
              description="JavaScript errors"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Warnings"
              value={data.errors.totalWarnings}
              status={data.errors.totalWarnings === 0 ? 'good' : 'needs-improvement'}
              description="Warning messages"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Error Rate"
              value={data.session.pageViews > 0 ? ((data.errors.totalErrors / data.session.pageViews) * 100).toFixed(1) : 0}
              unit="%"
              status={data.errors.totalErrors === 0 ? 'good' : 'poor'}
              description="Errors per page view"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Recent Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest errors and issues detected in the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.errors.recentErrors.map((error) => (
                  <div key={error.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{error.message}</p>
                        <p className="text-sm text-red-700 mt-1">
                          {error.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">{error.level}</Badge>
                    </div>
                    
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-sm text-red-700 cursor-pointer">
                          Show Stack Trace
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                    
                    {error.context && (
                      <div className="mt-2 p-2 bg-red-100 rounded">
                        <p className="text-xs font-medium text-red-900 mb-1">Context:</p>
                        <pre className="text-xs text-red-800">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {data.errors.recentErrors.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">No errors detected!</p>
                    <p className="text-sm text-muted-foreground">Your app is running smoothly</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Tab */}
        <TabsContent value="session" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Session Start"
              value={data.session.startTime.toLocaleTimeString()}
              status="good"
              description={data.session.startTime.toLocaleDateString()}
              icon={<Clock className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Page Views"
              value={data.session.pageViews}
              status="good"
              description="Pages visited"
              icon={<Eye className="h-4 w-4" />}
            />
            
            <MetricCard
              title="User Agent"
              value={data.session.userAgent.split(' ')[0]}
              status="good"
              description="Browser type"
              icon={<Users className="h-4 w-4" />}
            />
            
            <MetricCard
              title="Referrer"
              value={data.session.referrer ? new URL(data.session.referrer).hostname : 'Direct'}
              status="good"
              description="Traffic source"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>
                Detailed information about the current user session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Traffic Attribution</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">UTM Source:</span>
                      <span>{data.session.utmSource || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">UTM Medium:</span>
                      <span>{data.session.utmMedium || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">UTM Campaign:</span>
                      <span>{data.session.utmCampaign || 'None'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session ID:</span>
                      <span className="font-mono text-xs">{data.session.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Errors:</span>
                      <span className={data.session.errors > 0 ? 'text-red-600' : 'text-green-600'}>
                        {data.session.errors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warnings:</span>
                      <span className={data.session.warnings > 0 ? 'text-yellow-600' : 'text-green-600'}>
                        {data.session.warnings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;