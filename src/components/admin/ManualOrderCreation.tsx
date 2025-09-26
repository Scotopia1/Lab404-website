import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Calculator,
  Truck,
  X,
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

// Validation schemas
const customerInfoSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Valid phone number required (e.g., +96176666341)'),
  email: z.string().email('Valid email address required'),
  address: z.string().min(10, 'Complete address required (at least 10 characters)'),
});

const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Price must be positive'),
});

const manualOrderSchema = z.object({
  customerInfo: customerInfoSchema,
  items: z.array(orderItemSchema).min(1, 'At least one product is required'),
  paymentMethod: z.enum(['cash_on_delivery', 'whatsapp', 'bank_transfer', 'cash']),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  urgent: z.boolean().optional(),
});

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_url?: string;
  sku?: string;
}

interface OrderItem {
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

interface ManualOrderCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
}

export const ManualOrderCreation: React.FC<ManualOrderCreationProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [step, setStep] = useState<'customer' | 'products' | 'review'>('customer');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'whatsapp' | 'bank_transfer' | 'cash'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const queryClient = useQueryClient();

  // Fetch products for selection
  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery<Product[]>({
    queryKey: ['admin-products', productSearch],
    queryFn: () => {
      const filters: any = {
        limit: 20,
        status: 'active'
      };
      if (productSearch.trim()) {
        filters.search = productSearch.trim();
      }
      return apiClient.getAdminProducts(filters).then(res => res.data || []);
    },
    enabled: isOpen,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('customer');
      setCustomerInfo({ fullName: '', phone: '', email: '', address: '' });
      setOrderItems([]);
      setPaymentMethod('cash_on_delivery');
      setNotes('');
      setUrgent(false);
      setErrors({});
    }
  }, [isOpen]);

  // Validation functions
  const validateCustomerInfo = (): boolean => {
    try {
      customerInfoSchema.parse(customerInfo);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateOrderItems = (): boolean => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one product to the order');
      return false;
    }

    for (const item of orderItems) {
      try {
        orderItemSchema.parse(item);
      } catch (error) {
        toast.error(`Invalid item: ${item.product?.name || 'Unknown product'}`);
        return false;
      }
    }
    return true;
  };

  // Order items management
  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);

    if (existingItem) {
      updateItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        product_id: product.id,
        product,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      };
      setOrderItems(prev => [...prev, newItem]);
    }
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
          : item
      )
    );
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, unit_price: newPrice, total_price: newPrice * item.quantity }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.product_id !== productId));
  };

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxRate = 0.11; // 11% VAT
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= 100 ? 0 : 5; // Free shipping over $100
    const total = subtotal + taxAmount + shippingAmount;

    return {
      subtotal,
      taxAmount,
      shippingAmount,
      total,
      itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiClient.createAdminOrder(orderData);
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.order_number} created successfully!`);
      queryClient.invalidateQueries(['admin-orders']);
      queryClient.invalidateQueries(['order-stats']);
      onOrderCreated?.(data.id);
      onClose();
    },
    onError: (error: any) => {
      console.error('Order creation error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create order';
      toast.error(errorMessage);
    },
  });

  const handleCreateOrder = async () => {
    if (!validateCustomerInfo() || !validateOrderItems()) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      const orderData = {
        payment_method: paymentMethod,
        guest_name: customerInfo.fullName,
        guest_phone: customerInfo.phone,
        guest_email: customerInfo.email,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        shipping_address: {
          first_name: customerInfo.fullName.split(' ')[0] || customerInfo.fullName,
          last_name: customerInfo.fullName.split(' ').slice(1).join(' ') || '',
          address_line_1: customerInfo.address,
          city: 'Beirut',
          postal_code: '00000',
          country: 'Lebanon',
          phone: customerInfo.phone,
        },
        notes: notes || undefined,
        currency: 'USD',
        urgent,
        created_by_admin: true,
      };

      await createOrderMutation.mutateAsync(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Manual Order
          </DialogTitle>
          <DialogDescription>
            Create a new order manually for phone orders or walk-in customers
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step Navigation */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                step === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">1. Customer Info</span>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                step === 'products' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">2. Add Products</span>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                step === 'review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">3. Review & Create</span>
              </div>
            </div>
          </div>

          {/* Step 1: Customer Information */}
          {step === 'customer' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={customerInfo.fullName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Customer's full name"
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
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
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
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="customer@example.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">Full Address *</Label>
                      <Textarea
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Complete delivery address including building, floor, and area"
                        rows={3}
                        className={errors.address ? 'border-red-500' : ''}
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (validateCustomerInfo()) {
                      setStep('products');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: Add Products
                  <Package className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Add Products */}
          {step === 'products' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full"
                      />

                      <ScrollArea className="h-96">
                        {productsLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="p-3 border rounded animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                                onClick={() => addProductToOrder(product)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-sm">{product.name}</h4>
                                    <p className="text-xs text-gray-500">{product.category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                                      <Badge variant="outline" className="text-xs">
                                        Stock: {product.stock_quantity}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Order Items ({orderItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {orderItems.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500">No products added yet</p>
                          <p className="text-sm text-gray-400">Search and click products to add them</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div key={item.product_id} className="p-3 border rounded">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{item.product?.name}</h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(item.product_id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Qty:</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(item.product_id, Number(e.target.value))}
                                      className="h-6 w-12 text-center text-xs p-0"
                                      min="1"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Price:</Label>
                                  <Input
                                    type="number"
                                    value={item.unit_price}
                                    onChange={(e) => updateItemPrice(item.product_id, Number(e.target.value))}
                                    className="h-6 text-xs flex-1"
                                    step="0.01"
                                    min="0"
                                  />
                                </div>

                                <div className="text-right">
                                  <span className="text-sm font-semibold">
                                    Total: ${item.total_price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('customer')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Back: Customer Info
                </Button>

                <Button
                  onClick={() => {
                    if (validateOrderItems()) {
                      setStep('review');
                    }
                  }}
                  disabled={orderItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: Review Order
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Create */}
          {step === 'review' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Items */}
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item.product_id} className="flex justify-between text-sm">
                            <span>{item.product?.name} × {item.quantity}</span>
                            <span>${item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Totals */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (11% VAT):</span>
                          <span>${totals.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{totals.shippingAmount === 0 ? 'Free' : `$${totals.shippingAmount.toFixed(2)}`}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>${totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value: any) => setPaymentMethod(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp Order</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Special instructions, customer requests, etc."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={urgent}
                        onChange={(e) => setUrgent(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="urgent" className="text-sm">
                        Mark as urgent order
                      </Label>
                    </div>

                    {/* Customer Info Review */}
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Customer Information</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span>{customerInfo.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{customerInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{customerInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{customerInfo.address}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('products')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Back: Edit Products
                </Button>

                <Button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || createOrderMutation.isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingOrder || createOrderMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualOrderCreation;