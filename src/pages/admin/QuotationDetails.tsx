import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Edit,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { quotationsApi } from '@/api/quotations';
import StatusHistoryPanel from '@/components/admin/StatusHistoryPanel';
import ApprovalRejectModal from '@/components/admin/ApprovalRejectModal';
import OrderConversionModal from '@/components/admin/OrderConversionModal';
import type { QuotationWithDetails, QuotationStatusHistory } from '@/types/quotation';
import {
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

const QuotationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<QuotationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Action dialogs state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [statusDialogAction, setStatusDialogAction] = useState<'send'>('send');
  const [statusReason, setStatusReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const loadQuotation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await quotationsApi.getQuotation(id, true); // Include history
      setQuotation(data);
    } catch (err) {
      console.error('Error loading quotation:', err);
      setError('Failed to load quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotation();
  }, [id]);

  // Enhanced approval workflow
  const handleApproval = async (data: {
    reason: string;
    notes: string;
    sendNotification: boolean;
  }) => {
    if (!quotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.approveQuotation(
        quotation.id,
        data.reason,
        data.notes,
        data.sendNotification
      );

      setError(null);
      await loadQuotation(); // Reload to get updated data
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
    if (!quotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.rejectQuotation(
        quotation.id,
        data.reason,
        data.notes,
        data.sendNotification
      );

      setError(null);
      await loadQuotation(); // Reload to get updated data
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
    if (!quotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.convertToOrder(quotation.id, data);

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
    if (!quotation) return;

    try {
      setActionLoading(true);

      if (statusDialogAction === 'send') {
        await quotationsApi.approveQuotation(quotation.id, statusReason, statusNotes);
      } else if (statusDialogAction === 'reject') {
        await quotationsApi.rejectQuotation(quotation.id, statusReason, statusNotes);
      } else if (statusDialogAction === 'send') {
        await quotationsApi.sendQuotation(quotation.id, statusNotes);
      }

      setShowStatusDialog(false);
      setStatusReason('');
      setStatusNotes('');
      loadQuotation(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating quotation status:', err);
      setError('Failed to update quotation status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quotation) return;

    try {
      setActionLoading(true);
      const result = await quotationsApi.convertToOrder(quotation.id);
      // Navigate to the created order
      navigate(`/admin/orders/${result.order_id}`);
    } catch (err) {
      console.error('Error converting to order:', err);
      setError('Failed to convert quotation to order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateQuotation = async () => {
    if (!quotation) return;

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

  const handleGeneratePDF = async () => {
    if (!quotation) return;

    try {
      setActionLoading(true);
      const pdfData = await quotationsApi.generateQuotationPDF(quotation.id);
      // TODO: Implement PDF generation on frontend or handle download
      console.log('PDF data:', pdfData);
      // For now, just show success message
      alert('PDF generation feature coming soon!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusDialog = (action: 'approve' | 'reject' | 'send') => {
    setStatusDialogAction(action);
    setStatusReason('');
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading quotation...</span>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error || 'Quotation not found'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/admin/quotations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotations
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const expired = isQuotationExpired(quotation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link to="/admin/quotations">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quotations
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{quotation.quotation_number}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant={getQuotationStatusBadgeVariant(quotation.status)}>
                      {formatQuotationStatus(quotation.status)}
                    </Badge>
                    {expired && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canEditQuotation(quotation) && (
                <Button asChild variant="outline">
                  <Link to={`/admin/quotations/edit/${quotation.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              <Button variant="outline" onClick={handleDuplicateQuotation} disabled={actionLoading}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>

              <Button variant="outline" onClick={handleGeneratePDF} disabled={actionLoading}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>

              {canSendQuotation(quotation) && (
                <Button onClick={() => openStatusDialog('send')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              )}

              {canApproveQuotation(quotation) && (
                <Button onClick={() => openStatusDialog('approve')} disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}

              {canRejectQuotation(quotation) && (
                <Button variant="destructive" onClick={() => openStatusDialog('reject')} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}

              {canConvertQuotation(quotation) && (
                <Button onClick={handleConvertToOrder} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Convert to Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quotation Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Quotation Items ({quotation.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Discount</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.items.map((item, index) => (
                        <tr key={item.id} className={index < quotation.items.length - 1 ? 'border-b' : ''}>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.product_name}</p>
                              {item.product_sku && (
                                <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                              )}
                              {item.product_description && (
                                <p className="text-sm text-gray-600">{item.product_description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">{item.quantity}</td>
                          <td className="py-3 text-right">{formatCurrency(item.unit_price, quotation.currency)}</td>
                          <td className="py-3 text-right">
                            {item.discount_percentage > 0 && (
                              <span className="text-green-600">-{item.discount_percentage}%</span>
                            )}
                            {item.discount_amount > 0 && (
                              <span className="text-green-600">-{formatCurrency(item.discount_amount, quotation.currency)}</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrency(item.line_total, quotation.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(quotation.subtotal, quotation.currency)}</span>
                  </div>

                  {quotation.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {quotation.discount_percentage > 0 && ` (${quotation.discount_percentage}%)`}:
                      </span>
                      <span>-{formatCurrency(quotation.discount_amount, quotation.currency)}</span>
                    </div>
                  )}

                  {quotation.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Tax {quotation.tax_percentage > 0 && `(${quotation.tax_percentage}%)`}:
                      </span>
                      <span>{formatCurrency(quotation.tax_amount, quotation.currency)}</span>
                    </div>
                  )}

                  {quotation.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span>{formatCurrency(quotation.shipping_amount, quotation.currency)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(quotation.total_amount, quotation.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(quotation.notes || quotation.internal_notes || quotation.terms_and_conditions) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quotation.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Customer Notes</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
                    </div>
                  )}

                  {quotation.internal_notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Internal Notes</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{quotation.internal_notes}</p>
                    </div>
                  )}

                  {quotation.terms_and_conditions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            {quotation.status_history && quotation.status_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Status History
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showHistory ? 'Hide' : 'Show'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showHistory && (
                  <CardContent>
                    <div className="space-y-4">
                      {quotation.status_history.map((history, index) => (
                        <div key={history.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">
                                {history.old_status && `${formatQuotationStatus(history.old_status as any)} → `}
                                {formatQuotationStatus(history.new_status as any)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDateTime(history.created_at)}
                              </span>
                            </div>
                            {history.reason && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Reason:</span> {history.reason}
                              </p>
                            )}
                            {history.notes && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{quotation.customer_name}</h4>
                  {quotation.customer_company && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {quotation.customer_company}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${quotation.customer_email}`} className="text-blue-600 hover:underline">
                      {quotation.customer_email}
                    </a>
                  </div>

                  {quotation.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${quotation.customer_phone}`} className="text-blue-600 hover:underline">
                        {quotation.customer_phone}
                      </a>
                    </div>
                  )}

                  {quotation.customer_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{quotation.customer_address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quotation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quotation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={getQuotationStatusBadgeVariant(quotation.status)}>
                      {formatQuotationStatus(quotation.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(quotation.total_amount, quotation.currency)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valid Until:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${expired ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(quotation.valid_until)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm text-gray-900">{formatDate(quotation.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created By:</span>
                    <span className="text-sm text-gray-900">{quotation.created_by_name}</span>
                  </div>

                  {quotation.approved_by_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved By:</span>
                      <span className="text-sm text-gray-900">{quotation.approved_by_name}</span>
                    </div>
                  )}

                  {quotation.approved_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved At:</span>
                      <span className="text-sm text-gray-900">{formatDateTime(quotation.approved_at)}</span>
                    </div>
                  )}

                  {quotation.sent_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sent At:</span>
                      <span className="text-sm text-gray-900">{formatDateTime(quotation.sent_at)}</span>
                    </div>
                  )}

                  {quotation.converted_order_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Order:</span>
                      <Button asChild variant="link" size="sm" className="p-0 h-auto">
                        <Link to={`/admin/orders/${quotation.converted_order_id}`}>
                          View Order
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialogAction === 'approve' && 'Approve Quotation'}
              {statusDialogAction === 'reject' && 'Reject Quotation'}
              {statusDialogAction === 'send' && 'Send Quotation'}
            </DialogTitle>
            <DialogDescription>
              {statusDialogAction === 'approve' && `Approve quotation ${quotation.quotation_number}?`}
              {statusDialogAction === 'reject' && `Reject quotation ${quotation.quotation_number}?`}
              {statusDialogAction === 'send' && `Send quotation ${quotation.quotation_number} to customer?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(statusDialogAction === 'approve' || statusDialogAction === 'reject') && (
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Enter additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={statusDialogAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleStatusChange}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {statusDialogAction === 'approve' && 'Approve'}
              {statusDialogAction === 'reject' && 'Reject'}
              {statusDialogAction === 'send' && 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationDetails;