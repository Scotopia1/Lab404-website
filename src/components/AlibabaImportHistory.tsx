import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Search, Filter, Trash2, ExternalLink, CheckCircle, XCircle,
  Calendar, Package, AlertTriangle, Download, RefreshCw
} from 'lucide-react';
import { contentImportManager, ImportRecord } from '@/lib/alibaba/ContentImportManager';

const AlibabaImportHistory = () => {
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ImportRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<ImportRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, statusFilter]);

  const loadHistory = () => {
    const importHistory = contentImportManager.getImportHistory();
    setHistory(importHistory);
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.alibabaId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const isSuccess = statusFilter === 'success';
      filtered = filtered.filter(record => record.success === isSuccess);
    }

    setFilteredHistory(filtered);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all import history? This action cannot be undone.')) {
      contentImportManager.clearHistory();
      loadHistory();
    }
  };

  const openDetails = (record: ImportRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        Failed
      </Badge>
    );
  };

  const stats = contentImportManager.getImportStats();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Import History
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadHistory}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearHistory}
                disabled={history.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product name or Alibaba ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="failed">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* History Table */}
          {filteredHistory.length > 0 ? (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Import Date</TableHead>
                    <TableHead>Alibaba ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.success)}
                          {getStatusBadge(record.success)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{record.productName}</p>
                          {record.productId && (
                            <p className="text-xs text-gray-500">ID: {record.productId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(record.importedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono text-gray-600 max-w-32 truncate">
                          {record.alibabaId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(record)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          {record.errors && record.errors.length > 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {history.length === 0 ? (
                <div className="space-y-2">
                  <Package className="h-12 w-12 mx-auto text-gray-300" />
                  <p>No import history found</p>
                  <p className="text-sm">Start importing products to see history here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Search className="h-12 w-12 mx-auto text-gray-300" />
                  <p>No results found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedRecord.success)}
                    {getStatusBadge(selectedRecord.success)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Import Date</p>
                  <p className="text-sm">{formatDate(selectedRecord.importedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Product Name</p>
                  <p className="text-sm font-medium">{selectedRecord.productName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Product ID</p>
                  <p className="text-sm font-mono">{selectedRecord.productId || 'N/A'}</p>
                </div>
              </div>

              {/* Alibaba Info */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Alibaba Details</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono break-all">{selectedRecord.alibabaId}</p>
                </div>
              </div>

              {/* Import Options */}
              {selectedRecord.options && Object.keys(selectedRecord.options).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Import Options</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs">
                      {JSON.stringify(selectedRecord.options, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Errors */}
              {selectedRecord.errors && selectedRecord.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Errors</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {selectedRecord.errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedRecord.success && selectedRecord.productId && (
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Product
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlibabaImportHistory;