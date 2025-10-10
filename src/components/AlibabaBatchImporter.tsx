import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Upload, Download, Play, Pause, Square, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Clock, FileText, Zap, Settings, Trash2
} from 'lucide-react';

interface BatchUrl {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  productName?: string;
  error?: string;
  progress?: number;
}

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
}

interface BatchSettings {
  batchSize: number;
  delayBetweenBatches: number;
  skipDuplicates: boolean;
  autoRetry: boolean;
  defaultCategory: string;
  defaultMarkup: number;
}

const AlibabaBatchImporter = () => {
  const [urlsText, setUrlsText] = useState('');
  const [batchUrls, setBatchUrls] = useState<BatchUrl[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    pending: 0
  });
  const [settings, setSettings] = useState<BatchSettings>({
    batchSize: 3,
    delayBetweenBatches: 2000,
    skipDuplicates: true,
    autoRetry: true,
    defaultCategory: 'Electronics',
    defaultMarkup: 30
  });
  const [logs, setLogs] = useState<Array<{id: string, timestamp: Date, message: string, type: 'info' | 'success' | 'error'}>>([]);

  const pauseRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const parseUrls = () => {
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => url.includes('alibaba.com'));

    if (urls.length === 0) {
      addLog('No valid Alibaba URLs found', 'error');
      return;
    }

    const batchItems: BatchUrl[] = urls.map((url, index) => ({
      id: `batch_${Date.now()}_${index}`,
      url,
      status: 'pending'
    }));

    setBatchUrls(batchItems);
    setProgress({
      total: batchItems.length,
      completed: 0,
      failed: 0,
      processing: 0,
      pending: batchItems.length
    });

    addLog(`Parsed ${urls.length} URLs for batch import`, 'success');
  };

  const updateUrlStatus = (id: string, status: BatchUrl['status'], updates: Partial<BatchUrl> = {}) => {
    setBatchUrls(prev => prev.map(item =>
      item.id === id ? { ...item, status, ...updates } : item
    ));

    // Update progress
    setProgress(prev => {
      const newProgress = { ...prev };
      const currentItem = batchUrls.find(item => item.id === id);

      if (currentItem) {
        // Decrease old status count
        newProgress[currentItem.status]--;
        // Increase new status count
        newProgress[status]++;
      }

      return newProgress;
    });
  };

  const processSingleUrl = async (batchUrl: BatchUrl): Promise<void> => {
    try {
      updateUrlStatus(batchUrl.id, 'processing');
      addLog(`Processing: ${batchUrl.url}`, 'info');

      // Simulate API call to preview/scrape the product
      // In real implementation, this would call apiClient.previewAlibabaProduct
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Simulate random success/failure for demo
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        const productName = `Product ${Math.floor(Math.random() * 1000)}`;
        updateUrlStatus(batchUrl.id, 'completed', { productName });
        addLog(`Successfully imported: ${productName}`, 'success');
      } else {
        const error = 'Failed to scrape product data';
        updateUrlStatus(batchUrl.id, 'failed', { error });
        addLog(`Failed to import: ${batchUrl.url} - ${error}`, 'error');
      }
    } catch (error) {
      updateUrlStatus(batchUrl.id, 'failed', { error: String(error) });
      addLog(`Error processing: ${batchUrl.url} - ${error}`, 'error');
    }
  };

  const startBatchImport = async () => {
    if (batchUrls.length === 0) {
      addLog('No URLs to process', 'error');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    pauseRef.current = false;
    abortControllerRef.current = new AbortController();

    addLog(`Starting batch import of ${batchUrls.length} products`, 'info');

    const pendingUrls = batchUrls.filter(url => url.status === 'pending');

    try {
      // Process in batches
      for (let i = 0; i < pendingUrls.length; i += settings.batchSize) {
        if (pauseRef.current || abortControllerRef.current?.signal.aborted) {
          addLog('Batch import paused', 'info');
          break;
        }

        const batch = pendingUrls.slice(i, i + settings.batchSize);
        addLog(`Processing batch ${Math.floor(i / settings.batchSize) + 1}`, 'info');

        // Process batch in parallel
        await Promise.allSettled(
          batch.map(url => processSingleUrl(url))
        );

        // Add delay between batches (except for last batch)
        if (i + settings.batchSize < pendingUrls.length && !pauseRef.current) {
          addLog(`Waiting ${settings.delayBetweenBatches}ms before next batch...`, 'info');
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenBatches));
        }
      }

      if (!pauseRef.current && !abortControllerRef.current?.signal.aborted) {
        const completed = batchUrls.filter(url => url.status === 'completed').length;
        const failed = batchUrls.filter(url => url.status === 'failed').length;
        addLog(`Batch import completed: ${completed} successful, ${failed} failed`, 'success');
      }
    } catch (error) {
      addLog(`Batch import error: ${error}`, 'error');
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
    }
  };

  const pauseBatchImport = () => {
    pauseRef.current = true;
    setIsPaused(true);
    addLog('Pausing batch import...', 'info');
  };

  const resumeBatchImport = () => {
    pauseRef.current = false;
    setIsPaused(false);
    startBatchImport();
  };

  const stopBatchImport = () => {
    pauseRef.current = true;
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setIsPaused(false);
    addLog('Batch import stopped', 'info');
  };

  const clearAll = () => {
    setBatchUrls([]);
    setUrlsText('');
    setLogs([]);
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      pending: 0
    });
    addLog('Cleared all batch data', 'info');
  };

  const retryFailed = () => {
    setBatchUrls(prev => prev.map(item =>
      item.status === 'failed' ? { ...item, status: 'pending', error: undefined } : item
    ));

    setProgress(prev => ({
      ...prev,
      pending: prev.pending + prev.failed,
      failed: 0
    }));

    addLog('Reset failed imports to pending', 'info');
  };

  const progressPercentage = progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk URL Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="urls-input">Alibaba Product URLs (one per line)</Label>
            <Textarea
              id="urls-input"
              placeholder="https://www.alibaba.com/product-detail/example1
https://www.alibaba.com/product-detail/example2
https://www.alibaba.com/product-detail/example3"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={8}
              className="mt-2 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseUrls} disabled={!urlsText.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Parse URLs
            </Button>
            <Button variant="outline" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Paste multiple Alibaba product URLs, one per line. Only valid Alibaba URLs will be processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Batch Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Batch Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              min="1"
              max="10"
              value={settings.batchSize}
              onChange={(e) => setSettings(prev => ({ ...prev, batchSize: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="delay">Delay Between Batches (ms)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              max="10000"
              step="500"
              value={settings.delayBetweenBatches}
              onChange={(e) => setSettings(prev => ({ ...prev, delayBetweenBatches: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="markup">Default Markup (%)</Label>
            <Input
              id="markup"
              type="number"
              min="0"
              max="200"
              value={settings.defaultMarkup}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultMarkup: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="skip-duplicates"
              checked={settings.skipDuplicates}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, skipDuplicates: checked }))}
            />
            <Label htmlFor="skip-duplicates">Skip Duplicates</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-retry"
              checked={settings.autoRetry}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRetry: checked }))}
            />
            <Label htmlFor="auto-retry">Auto Retry Failed</Label>
          </div>
        </CardContent>
      </Card>

      {/* Progress and Controls */}
      {batchUrls.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Batch Progress
              </CardTitle>
              <div className="flex gap-2">
                {!isProcessing && !isPaused && (
                  <Button onClick={startBatchImport} disabled={progress.pending === 0}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Import
                  </Button>
                )}
                {isProcessing && !isPaused && (
                  <Button variant="outline" onClick={pauseBatchImport}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {isPaused && (
                  <Button onClick={resumeBatchImport}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                {(isProcessing || isPaused) && (
                  <Button variant="destructive" onClick={stopBatchImport}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
                {progress.failed > 0 && !isProcessing && (
                  <Button variant="outline" onClick={retryFailed}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Failed
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-gray-600">
                <Clock className="h-3 w-3 mr-1" />
                Pending: {progress.pending}
              </Badge>
              <Badge variant="default" className="bg-blue-100 text-blue-700">
                <RefreshCw className="h-3 w-3 mr-1" />
                Processing: {progress.processing}
              </Badge>
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed: {progress.completed}
              </Badge>
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Failed: {progress.failed}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL List and Logs */}
      {batchUrls.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* URL List */}
          <Card>
            <CardHeader>
              <CardTitle>Import Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {batchUrls.map((batchUrl) => (
                    <div
                      key={batchUrl.id}
                      className={`p-3 rounded-lg border ${
                        batchUrl.status === 'completed' ? 'bg-green-50 border-green-200' :
                        batchUrl.status === 'failed' ? 'bg-red-50 border-red-200' :
                        batchUrl.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            batchUrl.status === 'completed' ? 'default' :
                            batchUrl.status === 'failed' ? 'destructive' :
                            batchUrl.status === 'processing' ? 'default' :
                            'outline'
                          }
                          className={
                            batchUrl.status === 'completed' ? 'bg-green-100 text-green-700' :
                            batchUrl.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            ''
                          }
                        >
                          {batchUrl.status}
                        </Badge>
                        {batchUrl.status === 'processing' && (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        )}
                      </div>

                      <p className="text-sm font-mono text-gray-600 break-all mb-2">
                        {batchUrl.url}
                      </p>

                      {batchUrl.productName && (
                        <p className="text-sm font-medium text-green-700">
                          {batchUrl.productName}
                        </p>
                      )}

                      {batchUrl.error && (
                        <p className="text-sm text-red-600">
                          Error: {batchUrl.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Import Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`text-sm p-2 rounded ${
                        log.type === 'success' ? 'bg-green-50 text-green-700' :
                        log.type === 'error' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-xs text-gray-500 mt-0.5 font-mono">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No logs yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AlibabaBatchImporter;