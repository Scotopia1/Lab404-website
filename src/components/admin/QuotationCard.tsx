import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { QuotationWithDetails } from '@/types/quotation';
import {
  getQuotationStatusBadgeVariant,
  formatQuotationStatus,
  formatCurrency,
  formatDate,
  canEditQuotation,
  canSendQuotation,
  canApproveQuotation,
  canRejectQuotation,
  canConvertQuotation,
  isQuotationExpired,
} from '@/types/quotation';

interface QuotationCardProps {
  quotation: QuotationWithDetails;
  onApprove?: (quotation: QuotationWithDetails) => void;
  onReject?: (quotation: QuotationWithDetails) => void;
  onSend?: (quotation: QuotationWithDetails) => void;
  onConvert?: (quotation: QuotationWithDetails) => void;
  onDuplicate?: (quotation: QuotationWithDetails) => void;
  onDelete?: (quotation: QuotationWithDetails) => void;
}

const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  onApprove,
  onReject,
  onSend,
  onConvert,
  onDuplicate,
  onDelete,
}) => {
  const expired = isQuotationExpired(quotation);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <Link
                to={`/admin/quotations/${quotation.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {quotation.quotation_number}
              </Link>
              <div className="flex items-center gap-2 mt-1">
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

              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(quotation)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {canSendQuotation(quotation) && onSend && (
                <DropdownMenuItem onClick={() => onSend(quotation)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Customer
                </DropdownMenuItem>
              )}

              {canApproveQuotation(quotation) && onApprove && (
                <DropdownMenuItem onClick={() => onApprove(quotation)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </DropdownMenuItem>
              )}

              {canRejectQuotation(quotation) && onReject && (
                <DropdownMenuItem onClick={() => onReject(quotation)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              )}

              {canConvertQuotation(quotation) && onConvert && (
                <DropdownMenuItem onClick={() => onConvert(quotation)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Convert to Order
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {canEditQuotation(quotation) && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(quotation)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Info */}
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {quotation.customer_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{quotation.customer_email}</p>
              {quotation.customer_company && (
                <p className="text-xs text-gray-500 truncate">{quotation.customer_company}</p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(quotation.total_amount, quotation.currency)}
              </p>
              <p className="text-xs text-gray-500">{quotation.item_count} items</p>
            </div>
          </div>

          {/* Valid Until */}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Valid until</p>
              <p className={`text-sm font-medium ${
                expired ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatDate(quotation.valid_until)}
              </p>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(quotation.created_at)}
              </p>
              <p className="text-xs text-gray-500">by {quotation.created_by_name}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Link to={`/admin/quotations/${quotation.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>

            {canEditQuotation(quotation) && (
              <Link to={`/admin/quotations/edit/${quotation.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canSendQuotation(quotation) && onSend && (
              <Button size="sm" onClick={() => onSend(quotation)}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            )}

            {canApproveQuotation(quotation) && onApprove && (
              <Button size="sm" onClick={() => onApprove(quotation)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}

            {canRejectQuotation(quotation) && onReject && (
              <Button variant="destructive" size="sm" onClick={() => onReject(quotation)}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}

            {canConvertQuotation(quotation) && onConvert && (
              <Button
                size="sm"
                onClick={() => onConvert(quotation)}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Convert
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${
              quotation.status === 'draft' ? 'bg-gray-400' :
              quotation.status === 'sent' ? 'bg-blue-400' :
              quotation.status === 'approved' ? 'bg-green-400' :
              quotation.status === 'rejected' ? 'bg-red-400' :
              quotation.status === 'converted' ? 'bg-purple-400' :
              'bg-yellow-400'
            }`} />
            <span>
              {quotation.status === 'draft' && 'Draft - Ready to send'}
              {quotation.status === 'sent' && 'Sent - Awaiting customer response'}
              {quotation.status === 'approved' && 'Approved - Ready to convert'}
              {quotation.status === 'rejected' && 'Rejected'}
              {quotation.status === 'converted' && 'Converted to order'}
              {quotation.status === 'expired' && 'Expired'}
            </span>
          </div>
        </div>

        {/* Items Preview */}
        {quotation.items.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Items:</span>
            </div>
            <div className="space-y-1">
              {quotation.items.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1 mr-2">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(item.line_total, quotation.currency)}
                  </span>
                </div>
              ))}
              {quotation.items.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{quotation.items.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* PDF Preview Dialog */}
      <QuotationPDFPreview
        quotation={quotation}
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        onEmailSent={handleEmailSent}
      />
    </Card>
  );
};

export default QuotationCard;