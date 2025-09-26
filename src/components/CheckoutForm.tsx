import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Truck, Calculator, X, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartStore, useCartSummary } from '@/stores/useCartStore';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

// Lebanese regions and cities
const lebanonRegions = [
  { value: 'beirut', label: 'Beirut' },
  { value: 'mount-lebanon', label: 'Mount Lebanon' },
  { value: 'north-lebanon', label: 'North Lebanon' },
  { value: 'south-lebanon', label: 'South Lebanon' },
  { value: 'bekaa', label: 'Bekaa Valley' },
  { value: 'nabatieh', label: 'Nabatieh' }
];

// Checkout form validation schema
const checkoutFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +96176666341)'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Please enter your complete address (at least 10 characters)'),
  region: z.string().min(1, 'Please select your region'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

interface OrderCalculation {
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  delivery_estimate: {
    min_date: string;
    max_date: string;
    display_text: string;
  };
  breakdown: {
    items: Array<{ product_id: string; quantity: number; unit_price: number; total_price: number }>;
    tax: {
      amount: number;
      rate: number;
      label: string;
      enabled: boolean;
    };
    delivery: {
      amount: number;
      enabled: boolean;
      free_threshold?: number;
    };
    discount: {
      amount: number;
    };
    total: number;
  };
}

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CheckoutFormData & { calculation: OrderCalculation }) => Promise<void>;
}

export const CheckoutForm = ({ isOpen, onClose, onSubmit }: CheckoutFormProps) => {
  const { items } = useCartStore();
  const cartSummary = useCartSummary();

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    region: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
  const [calculation, setCalculation] = useState<OrderCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate order totals when component mounts or items change
  useEffect(() => {
    if (items.length > 0) {
      calculateOrderTotals();
    }
  }, [items]);

  const calculateOrderTotals = async () => {
    setIsCalculating(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const response = await apiClient.post('/orders/calculate', {
        items: orderItems,
        payment_method: 'cash_on_delivery',
        discount_amount: 0,
      });

      // API client returns the data directly, not wrapped in success/data
      setCalculation(response);
    } catch (error) {
      console.error('Error calculating order totals:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      checkoutFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<CheckoutFormData> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CheckoutFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !calculation) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, calculation });
    } catch (error) {
      console.error('Error submitting checkout form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-end mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-50 hover:text-red-600 rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <MapPin className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+96176666341"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="region">Delivery Region *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      {lebanonRegions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && (
                    <p className="text-sm text-red-500 mt-1">{errors.region}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your complete delivery address including building, floor, and area"
                    rows={3}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for delivery or notes about your order"
                    rows={2}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Calculator className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <p className="text-center py-4">Calculating totals...</p>
                ) : calculation ? (
                  <div className="space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {calculation.breakdown.items.map((item, index) => {
                        const cartItem = items[index];
                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{cartItem?.name || 'Product'} × {item.quantity}</span>
                            <span>${item.total_price.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />

                    {/* Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${calculation.subtotal.toFixed(2)}</span>
                      </div>

                      {calculation.breakdown.tax.enabled && (
                        <div className="flex justify-between text-sm">
                          <span>{calculation.breakdown.tax.label} ({(calculation.breakdown.tax.rate * 100).toFixed(0)}%)</span>
                          <span>${calculation.tax_amount.toFixed(2)}</span>
                        </div>
                      )}

                      {calculation.breakdown.delivery.enabled && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Delivery Fee
                            {calculation.breakdown.delivery.free_threshold &&
                             calculation.subtotal >= calculation.breakdown.delivery.free_threshold &&
                             ' (Free!)'}
                          </span>
                          <span>${calculation.shipping_amount.toFixed(2)}</span>
                        </div>
                      )}

                      {calculation.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-${calculation.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculation.total_amount.toFixed(2)}</span>
                    </div>

                    {/* Delivery Information */}
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                      <Truck className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-100">
                        <strong>Estimated Delivery:</strong> {calculation.delivery_estimate.display_text}
                        <br />
                        <strong>Payment Method:</strong> Cash on Delivery Only
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to calculate order totals. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !calculation || isCalculating}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? 'Processing...' : 'Place Order (Cash on Delivery)'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;