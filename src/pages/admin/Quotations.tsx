import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertTriangle,
  Loader2,
  Download,
  Mail,
  Printer
} from 'lucide-react';
import QuotationPDFPreview from '@/components/admin/QuotationPDFPreview';
import ApprovalRejectModal from '@/components/admin/ApprovalRejectModal';
import OrderConversionModal from '@/components/admin/OrderConversionModal';
import { downloadQuotationPDF, printQuotationPDF } from '@/utils/pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { quotationsApi } from '@/api/quotations';
import type { QuotationWithDetails, QuotationFilters, QuotationStatus } from '@/types/quotation';
import {
  getQuotationStatusColor,
  getQuotationStatusBadgeVariant,
  formatQuotationStatus,
  formatCurrency,
  formatDate,
  formatDateTime,
  canEditQuotation,
  canSendQuotation,
  canApproveQuotation,
  canRejectQuotation,
  canConvertQuotation,
  isQuotationExpired,
} from '@/types/quotation';

const ITEMS_PER_PAGE = 20;

const Quotations: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuotations, setTotalQuotations] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'valid_until' | 'total_amount' | 'status' | 'quotation_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Action dialogs state
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithDetails | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusDialogAction, setStatusDialogAction] = useState<'send'>('send');
  const [statusReason, setStatusReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // PDF preview state
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfQuotation, setPdfQuotation] = useState<QuotationWithDetails | null>(null);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    averageValue: 0,
    statusCounts: {} as Record<QuotationStatus, number>,
    conversionRate: 0,
  });

  // Load quotations
  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: Partial<QuotationFilters> = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (statusFilter !== 'all') {
        filters.status = statusFilter as QuotationStatus;
      }

      if (dateFromFilter) {
        filters.date_from = new Date(dateFromFilter);
      }

      if (dateToFilter) {
        filters.date_to = new Date(dateToFilter);
      }

      const response = await quotationsApi.getQuotations(filters);
      setQuotations(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalQuotations(response.pagination.total);
    } catch (err) {
      console.error('Error loading quotations:', err);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const calculatedStats = await quotationsApi.calculateQuotationStats();
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    loadStats();
  }, []);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadQuotations();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1);
    loadQuotations();
  };

  // Handle quotation actions
  const handleDeleteQuotation = async () => {
    if (!selectedQuotation) return;

    try {
      setActionLoading(true);
      await quotationsApi.deleteQuotation(selectedQuotation.id);
      setShowDeleteDialog(false);
      loadQuotations();
      loadStats();
    } catch (err) {
      console.error('Error deleting quotation:', err);
      setError('Failed to delete quotation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced approval workflow
  const handleApproval = async (data: {
    reason: string;
    notes: string;
    sendNotification: boolean;
  }) => {
    if (!selectedQuotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.approveQuotation(
        selectedQuotation.id,
        data.reason,
        data.notes,
        data.sendNotification
      );

      // Show success message
      setError(null);
      console.log('Approval result:', result);
      loadQuotations();
      loadStats();
    } catch (err: any) {
      console.error('Error approving quotation:', err);
      setError('Failed to approve quotation. Please try again.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced rejection workflow
  const handleRejection = async (data: {
    reason: string;
    notes: string;
    sendNotification: boolean;
  }) => {
    if (!selectedQuotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.rejectQuotation(
        selectedQuotation.id,
        data.reason,
        data.notes,
        data.sendNotification
      );

      // Show success message
      setError(null);
      console.log('Rejection result:', result);
      loadQuotations();
      loadStats();
    } catch (err: any) {
      console.error('Error rejecting quotation:', err);
      setError('Failed to reject quotation. Please try again.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced order conversion workflow
  const handleOrderConversion = async (data: {
    partialConversion: boolean;
    itemsToConvert: string[];
    customerNotes: string;
    sendConfirmation: boolean;
  }) => {
    if (!selectedQuotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.convertToOrder(selectedQuotation.id, data);

      // Navigate to the created order
      navigate(`/admin/orders/${result.orderId}`);
    } catch (err: any) {
      console.error('Error converting to order:', err);
      setError('Failed to convert quotation to order. Please try again.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedQuotation) return;

    try {
      setActionLoading(true);

      if (statusDialogAction === 'send') {
        await quotationsApi.sendQuotation(selectedQuotation.id, statusNotes);
      }

      setShowStatusDialog(false);
      setStatusReason('');
      setStatusNotes('');
      loadQuotations();
      loadStats();
    } catch (err) {
      console.error('Error updating quotation status:', err);
      setError('Failed to update quotation status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async (quotation: QuotationWithDetails) => {
    setSelectedQuotation(quotation);
    setShowConversionDialog(true);
  };

  const handleDuplicateQuotation = async (quotation: QuotationWithDetails) => {
    try {
      setActionLoading(true);
      const duplicate = await quotationsApi.duplicateQuotation(quotation.id);
      navigate(`/admin/quotations/edit/${duplicate.id}`);
    } catch (err) {
      console.error('Error duplicating quotation:', err);
      setError('Failed to duplicate quotation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // PDF handlers
  const handlePDFPreview = (quotation: QuotationWithDetails) => {
    setPdfQuotation(quotation);
    setShowPDFPreview(true);
  };

  const handlePDFDownload = async (quotation: QuotationWithDetails) => {
    try {
      setActionLoading(true);
      await downloadQuotationPDF(quotation);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePDFPrint = async (quotation: QuotationWithDetails) => {
    try {
      setActionLoading(true);
      await printQuotationPDF(quotation);
    } catch (err) {
      console.error('Error printing PDF:', err);
      setError('Failed to print PDF. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalDialog = (quotation: QuotationWithDetails) => {
    setSelectedQuotation(quotation);
    setShowApprovalDialog(true);
  };

  const openRejectionDialog = (quotation: QuotationWithDetails) => {
    setSelectedQuotation(quotation);
    setShowRejectionDialog(true);
  };

  const openStatusDialog = (quotation: QuotationWithDetails, action: 'send') => {
    setSelectedQuotation(quotation);
    setStatusDialogAction(action);
    setStatusReason('');
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Quotations Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/quotations/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Quotation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Value</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.averageValue)}</p>
                </div>
                <MoreVertical className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Customer, email, or quotation #"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button onClick={handleSearch} variant="default">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={handleFilterChange} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFromFilter('');
                  setDateToFilter('');
                  setCurrentPage(1);
                  loadQuotations();
                }}
                variant="ghost"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quotations ({totalQuotations})</span>
              <div className="flex items-center gap-2">
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="valid_until-asc">Expiring Soon</SelectItem>
                    <SelectItem value="valid_until-desc">Expiring Latest</SelectItem>
                    <SelectItem value="total_amount-desc">Highest Value</SelectItem>
                    <SelectItem value="total_amount-asc">Lowest Value</SelectItem>
                    <SelectItem value="quotation_number-asc">Quotation # A-Z</SelectItem>
                    <SelectItem value="quotation_number-desc">Quotation # Z-A</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadQuotations}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading quotations...</span>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
                <p className="text-gray-600 mb-4">Create your first quotation to get started.</p>
                <Link to="/admin/quotations/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quotation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Quotation</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Valid Until</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quotation) => (
                      <tr key={quotation.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{quotation.quotation_number}</p>
                            <p className="text-sm text-gray-500">{quotation.item_count} items</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{quotation.customer_name}</p>
                            <p className="text-sm text-gray-500">{quotation.customer_email}</p>
                            {quotation.customer_company && (
                              <p className="text-sm text-gray-500">{quotation.customer_company}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={getQuotationStatusBadgeVariant(quotation.status)}>
                              {formatQuotationStatus(quotation.status)}
                            </Badge>
                            {isQuotationExpired(quotation) && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" title="Expired" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatCurrency(quotation.total_amount, quotation.currency)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={`text-sm ${
                              isQuotationExpired(quotation) ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {formatDate(quotation.valid_until)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-gray-600">{formatDate(quotation.created_at)}</p>
                            <p className="text-xs text-gray-500">by {quotation.created_by_name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/quotations/${quotation.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>

                              {canEditQuotation(quotation) && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/quotations/edit/${quotation.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleDuplicateQuotation(quotation)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => handlePDFPreview(quotation)}>
                                <FileText className="h-4 w-4 mr-2" />
                                PDF Preview
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handlePDFDownload(quotation)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handlePDFPrint(quotation)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print PDF
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {canSendQuotation(quotation) && (
                                <DropdownMenuItem onClick={() => openStatusDialog(quotation, 'send')}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to Customer
                                </DropdownMenuItem>
                              )}

                              {canApproveQuotation(quotation) && (
                                <DropdownMenuItem onClick={() => openApprovalDialog(quotation)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}

                              {canRejectQuotation(quotation) && (
                                <DropdownMenuItem onClick={() => openRejectionDialog(quotation)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              )}

                              {canConvertQuotation(quotation) && (
                                <DropdownMenuItem onClick={() => handleConvertToOrder(quotation)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Convert to Order
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {canEditQuotation(quotation) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalQuotations)} of {totalQuotations} quotations
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation {selectedQuotation?.quotation_number}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteQuotation}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quotation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              Send quotation {selectedQuotation?.quotation_number} to customer?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Enter additional notes for the customer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Approval Modal */}
      <ApprovalRejectModal
        isOpen={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        quotation={selectedQuotation}
        action="approve"
        onSubmit={handleApproval}
        loading={actionLoading}
      />

      {/* Enhanced Rejection Modal */}
      <ApprovalRejectModal
        isOpen={showRejectionDialog}
        onClose={() => setShowRejectionDialog(false)}
        quotation={selectedQuotation}
        action="reject"
        onSubmit={handleRejection}
        loading={actionLoading}
      />

      {/* Enhanced Order Conversion Modal */}
      <OrderConversionModal
        isOpen={showConversionDialog}
        onClose={() => setShowConversionDialog(false)}
        quotation={selectedQuotation}
        onSubmit={handleOrderConversion}
        loading={actionLoading}
      />

      {/* PDF Preview Dialog */}
      <QuotationPDFPreview
        quotation={pdfQuotation}
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false);
          setPdfQuotation(null);
        }}
        onEmailSent={() => {
          // Refresh quotations after email is sent
          loadQuotations();
        }}
      />
    </div>
  );
};

export default Quotations;