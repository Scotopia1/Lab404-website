import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react';
import { formatDate, formatDateTime, isQuotationExpired } from '@/types/quotation';
import type { QuotationWithDetails } from '@/types/quotation';

interface ApprovalRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationWithDetails | null;
  action: 'approve' | 'reject';
  onSubmit: (data: {
    reason: string;
    notes: string;
    sendNotification: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

const ApprovalRejectModal: React.FC<ApprovalRejectModalProps> = ({
  isOpen,
  onClose,
  quotation,
  action,
  onSubmit,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isApproval = action === 'approve';
  const isRejection = action === 'reject';

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotes('');
      setSendNotification(true);
      setError(null);
    }
  }, [isOpen, action]);

  // Pre-fill reason for common scenarios
  React.useEffect(() => {
    if (isOpen && quotation) {
      if (isApproval) {
        setReason('Quotation reviewed and approved');
      } else if (isRejection) {
        setReason(''); // Require manual input for rejections
      }
    }
  }, [isOpen, action, quotation]);

  const handleSubmit = async () => {
    if (!quotation) return;

    // Validation
    if (isRejection && !reason.trim()) {
      setError('Reason is required for quotation rejection');
      return;
    }

    if (isApproval && quotation && isQuotationExpired(quotation)) {
      setError('Cannot approve an expired quotation');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        reason: reason.trim(),
        notes: notes.trim(),
        sendNotification
      });
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} quotation`);
    }
  };

  if (!quotation) return null;

  const expired = isQuotationExpired(quotation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {isApproval ? 'Approve' : 'Reject'} Quotation
          </DialogTitle>
          <DialogDescription>
            {isApproval
              ? 'Approve this quotation and notify the customer'
              : 'Reject this quotation with a reason'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quotation Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <div><strong>Quotation:</strong> {quotation.quotation_number}</div>
              <div><strong>Customer:</strong> {quotation.customer_name}</div>
              <div><strong>Total:</strong> ${Number(quotation.total_amount).toFixed(2)} {quotation.currency}</div>
              <div><strong>Valid Until:</strong> {formatDate(quotation.valid_until)}</div>
              {expired && (
                <div className="text-red-600 font-medium">⚠️ This quotation has expired</div>
              )}
            </div>
          </div>

          {/* Expiration Warning for Approval */}
          {isApproval && expired && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This quotation has expired on {formatDate(quotation.valid_until)}.
                Expired quotations cannot be approved.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason Field */}
          <div>
            <Label htmlFor="reason">
              Reason {isRejection && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isApproval
                  ? 'Brief reason for approval (optional)'
                  : 'Please provide a reason for rejection'
              }
              className={isRejection && !reason.trim() ? 'border-red-300' : ''}
            />
            {isRejection && !reason.trim() && (
              <p className="text-sm text-red-600 mt-1">Reason is required for rejection</p>
            )}
          </div>

          {/* Notes Field */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional comments or instructions..."
              rows={3}
            />
          </div>

          {/* Send Notification Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="notification"
              checked={sendNotification}
              onCheckedChange={setSendNotification}
            />
            <Label htmlFor="notification" className="text-sm">
              Send notification to customer
            </Label>
          </div>

          {/* Notification Preview */}
          {sendNotification && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-blue-800">
                Customer will be notified via:
              </Label>
              <ul className="text-sm text-blue-700 mt-1">
                <li>• Email: {quotation.customer_email}</li>
                {quotation.customer_phone && (
                  <li>• WhatsApp: {quotation.customer_phone}</li>
                )}
              </ul>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (isApproval && expired) || (isRejection && !reason.trim())}
            className={
              isApproval
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApproval ? 'Approve Quotation' : 'Reject Quotation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalRejectModal;