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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ShoppingCart,
  AlertTriangle,
  Package,
  DollarSign,
  CheckCircle,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate, isQuotationExpired } from '@/types/quotation';
import type { QuotationWithDetails, QuotationItem } from '@/types/quotation';

interface OrderConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationWithDetails | null;
  onSubmit: (data: {
    partialConversion: boolean;
    itemsToConvert: string[];
    customerNotes: string;
    sendConfirmation: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

const OrderConversionModal: React.FC<OrderConversionModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onSubmit,
  loading = false
}) => {
  const [partialConversion, setPartialConversion] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && quotation) {
      setPartialConversion(false);
      setSelectedItems(quotation.items.map(item => item.id));
      setCustomerNotes('');
      setSendConfirmation(true);
      setError(null);
    }
  }, [isOpen, quotation]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!quotation) return;
    setSelectedItems(quotation.items.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const calculateSelectedTotal = () => {
    if (!quotation) return 0;
    return quotation.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.line_total, 0);
  };

  const handleSubmit = async () => {
    if (!quotation) return;

    // Validation
    if (selectedItems.length === 0) {
      setError('Please select at least one item to convert');
      return;
    }

    if (isQuotationExpired(quotation)) {
      setError('Cannot convert expired quotation to order');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        partialConversion: partialConversion && selectedItems.length < quotation.items.length,
        itemsToConvert: selectedItems,
        customerNotes: customerNotes.trim(),
        sendConfirmation
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to convert quotation to order');
    }
  };

  if (!quotation) return null;

  const expired = isQuotationExpired(quotation);
  const isPartial = partialConversion && selectedItems.length < quotation.items.length;
  const selectedTotal = calculateSelectedTotal();
  const selectedCount = selectedItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Convert to Order
          </DialogTitle>
          <DialogDescription>
            Convert this approved quotation to an actual order in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quotation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Quotation:</strong> {quotation.quotation_number}
              </div>
              <div>
                <strong>Customer:</strong> {quotation.customer_name}
              </div>
              <div>
                <strong>Total Value:</strong> {formatCurrency(quotation.total_amount, quotation.currency)}
              </div>
              <div className="flex items-center gap-2">
                <strong>Valid Until:</strong> {formatDate(quotation.valid_until)}
                {expired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
              </div>
            </div>
          </div>

          {/* Expiration Warning */}
          {expired && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This quotation has expired on {formatDate(quotation.valid_until)}.
                Expired quotations cannot be converted to orders.
              </AlertDescription>
            </Alert>
          )}

          {/* Conversion Type */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="partial"
                checked={partialConversion}
                onCheckedChange={setPartialConversion}
                disabled={expired}
              />
              <Label htmlFor="partial">Enable partial conversion</Label>
            </div>
            {partialConversion && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Partial conversion allows you to convert only selected items to an order.
                  The remaining items will stay in the approved quotation for future conversion.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Items Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Items to Convert</Label>
              {partialConversion && (
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              )}
            </div>

            <div className="border rounded-lg">
              {quotation.items.map((item: QuotationItem, index: number) => (
                <div key={item.id} className={`p-3 ${index > 0 ? 'border-t' : ''}`}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleItemToggle(item.id)}
                      disabled={!partialConversion || expired}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          {item.product_sku && (
                            <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.line_total, quotation.currency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} × {formatCurrency(item.unit_price, quotation.currency)}
                          </p>
                        </div>
                      </div>
                      {item.product_description && (
                        <p className="text-sm text-gray-600 mt-1">{item.product_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selection Summary */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-800">
                  Selected: {selectedCount} of {quotation.items.length} items
                </span>
                <span className="font-medium text-blue-900">
                  {formatCurrency(selectedTotal, quotation.currency)}
                </span>
              </div>
              {isPartial && (
                <p className="text-xs text-blue-700 mt-1">
                  Remaining items will stay in the quotation for future conversion
                </p>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div>
            <Label htmlFor="notes">Customer Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this order..."
              rows={3}
            />
          </div>

          {/* Send Confirmation */}
          <div className="flex items-center space-x-2">
            <Switch
              id="confirmation"
              checked={sendConfirmation}
              onCheckedChange={setSendConfirmation}
            />
            <Label htmlFor="confirmation" className="text-sm">
              Send order confirmation to customer
            </Label>
          </div>

          {/* Confirmation Preview */}
          {sendConfirmation && (
            <div className="bg-green-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-green-800">
                Order confirmation will be sent to:
              </Label>
              <ul className="text-sm text-green-700 mt-1">
                <li>• Email: {quotation.customer_email}</li>
                {quotation.customer_phone && (
                  <li>• WhatsApp: {quotation.customer_phone}</li>
                )}
              </ul>
            </div>
          )}

          {/* Process Preview */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Conversion Process
            </h4>
            <ul className="text-sm text-amber-700 mt-2 space-y-1">
              <li>✓ Order will be created with selected items</li>
              <li>✓ Customer will be notified {sendConfirmation ? 'via email/WhatsApp' : '(disabled)'}</li>
              <li>✓ Quotation status will be updated to {isPartial ? 'Approved (partial conversion)' : 'Converted'}</li>
              <li>✓ Order will be linked to this quotation for tracking</li>
            </ul>
          </div>

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
            disabled={loading || expired || selectedItems.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Order
            {selectedCount > 0 && selectedCount < quotation.items.length && ` (${selectedCount} items)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConversionModal;