import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CheckCircle, Clock, Package, Truck, FileCheck, XCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkUpdate: (updates: {
    status?: string;
    payment_status?: string;
  }) => Promise<void>;
}

export const BulkOperationsBar: React.FC<BulkOperationsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkUpdate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApply = async () => {
    if (!selectedStatus && !selectedPaymentStatus) {
      toast.error('Please select at least one update option');
      return;
    }

    try {
      setIsUpdating(true);
      const updates: any = {};
      
      if (selectedStatus) {
        updates.status = selectedStatus;
      }
      
      if (selectedPaymentStatus) {
        updates.payment_status = selectedPaymentStatus;
      }

      await onBulkUpdate(updates);
      
      // Clear selections after successful update
      setSelectedStatus('');
      setSelectedPaymentStatus('');
      onClearSelection();
      
      toast.success(`Successfully updated ${selectedCount} order(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus('');
    setSelectedPaymentStatus('');
    onClearSelection();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <FileCheck className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 min-w-[600px]">
            {/* Selection info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Status update dropdown */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="confirmed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmed</span>
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Processing</span>
                  </div>
                </SelectItem>
                <SelectItem value="shipped">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Shipped</span>
                  </div>
                </SelectItem>
                <SelectItem value="delivered">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    <span>Delivered</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <span>Cancelled</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Payment status dropdown */}
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="paid">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Paid</span>
                  </div>
                </SelectItem>
                <SelectItem value="failed">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Failed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isUpdating || (!selectedStatus && !selectedPaymentStatus)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
