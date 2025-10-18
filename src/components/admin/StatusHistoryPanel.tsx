import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  History,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock,
  AlertTriangle,
  User
} from 'lucide-react';
import { formatDateTime, getQuotationStatusColor, formatQuotationStatus } from '@/types/quotation';
import type { QuotationStatusHistory, QuotationStatus } from '@/types/quotation';

interface StatusHistoryPanelProps {
  history: QuotationStatusHistory[];
  loading?: boolean;
}

const StatusHistoryPanel: React.FC<StatusHistoryPanelProps> = ({
  history,
  loading = false
}) => {
  const getStatusIcon = (status: QuotationStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'converted':
        return <ShoppingCart className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getChangeDescription = (entry: QuotationStatusHistory) => {
    const oldStatus = entry.old_status;
    const newStatus = entry.new_status;

    if (oldStatus === null && newStatus === 'draft') {
      return 'Quotation created';
    }

    if (oldStatus === 'draft' && newStatus === 'sent') {
      return 'Quotation sent to customer';
    }

    if (oldStatus === 'sent' && newStatus === 'approved') {
      return 'Quotation approved';
    }

    if (oldStatus === 'sent' && newStatus === 'rejected') {
      return 'Quotation rejected';
    }

    if (oldStatus === 'approved' && newStatus === 'converted') {
      return 'Converted to order';
    }

    if (newStatus === 'expired') {
      return 'Quotation expired';
    }

    return `Status changed from ${formatQuotationStatus(oldStatus || 'unknown')} to ${formatQuotationStatus(newStatus)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No status history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Connector Line */}
              {index < history.length - 1 && (
                <div className="absolute left-4 top-10 w-0.5 h-12 bg-gray-200"></div>
              )}

              {/* Entry */}
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getQuotationStatusColor(entry.new_status)} text-white`}>
                  {getStatusIcon(entry.new_status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {getChangeDescription(entry)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`${getQuotationStatusColor(entry.new_status)} text-white border-transparent`}
                    >
                      {formatQuotationStatus(entry.new_status)}
                    </Badge>
                  </div>

                  {/* Timestamp and User */}
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(entry.created_at)}
                    </div>
                    {entry.changed_by_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.changed_by_name}
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {entry.reason && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Reason:</strong> {entry.reason}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <strong>Notes:</strong> {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Summary */}
        {history.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-sm text-gray-500">
              <p className="font-medium">Timeline Summary</p>
              <div className="mt-2 space-y-1">
                <div>Created: {formatDateTime(history[history.length - 1].created_at)}</div>
                {history.length > 1 && (
                  <div>Last Updated: {formatDateTime(history[0].created_at)}</div>
                )}
                <div>Total Changes: {history.length}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusHistoryPanel;