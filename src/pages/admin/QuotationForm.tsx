import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  User,
  DollarSign,
  Calendar,
  FileText,
  Save,
  Send,
  Loader2,
  AlertTriangle,
  X,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { quotationsApi } from '@/api/quotations';
import { apiClient } from '@/api/client';
import type {
  QuotationWithDetails,
  QuotationFormData,
  QuotationFormItem,
  ProductOption,
  CreateQuotationInput,
  UpdateQuotationInput
} from '@/types/quotation';
import {
  calculateLineTotal,
  calculateQuotationTotals,
  formatCurrency
} from '@/types/quotation';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'L.L.' },
];

const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. Prices are subject to change without notice.
3. Payment terms: 50% deposit, balance on delivery.
4. Delivery time: 7-14 business days.
5. All products come with manufacturer warranty.
6. Customer is responsible for any applicable taxes.`;

const QuotationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product selection state
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Form state
  const [formData, setFormData] = useState<QuotationFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_company: '',
    customer_address: '',
    valid_until: '',
    items: [],
    discount_percentage: 0,
    discount_amount: 0,
    tax_percentage: 0,
    shipping_amount: 0,
    currency: 'USD',
    notes: '',
    internal_notes: '',
    terms_and_conditions: DEFAULT_TERMS,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing quotation for editing
  const loadQuotation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const quotation = await quotationsApi.getQuotation(id);

      // Convert to form data
      const validUntil = new Date(quotation.valid_until);
      const formattedDate = validUntil.toISOString().split('T')[0];

      setFormData({
        customer_name: quotation.customer_name,
        customer_email: quotation.customer_email,
        customer_phone: quotation.customer_phone || '',
        customer_company: quotation.customer_company || '',
        customer_address: quotation.customer_address || '',
        valid_until: formattedDate,
        items: quotation.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          line_total: item.line_total,
          sort_order: item.sort_order,
        })),
        discount_percentage: quotation.discount_percentage,
        discount_amount: quotation.discount_amount,
        tax_percentage: quotation.tax_percentage,
        shipping_amount: quotation.shipping_amount,
        currency: quotation.currency,
        notes: quotation.notes || '',
        internal_notes: quotation.internal_notes || '',
        terms_and_conditions: quotation.terms_and_conditions || DEFAULT_TERMS,
      });
    } catch (err) {
      console.error('Error loading quotation:', err);
      setError('Failed to load quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search products using Meilisearch
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setSearchingProducts(true);
      const response = await apiClient.searchProducts(query, {
        limit: 20,
        filters: {
          is_active: true,
        },
      });

      const productOptions: ProductOption[] = response.hits.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        description: product.description,
        in_stock: product.in_stock,
        stock_quantity: product.stock_quantity,
        category: product.category,
        images: product.images,
      }));

      setProducts(productOptions);
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      loadQuotation();
    } else {
      // Set default valid until date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        valid_until: futureDate.toISOString().split('T')[0],
      }));
    }
  }, [id, isEditing]);

  // Calculate totals when items or discounts change
  useEffect(() => {
    const calculations = calculateQuotationTotals(
      formData.items,
      formData.discount_percentage,
      formData.discount_amount,
      formData.tax_percentage,
      formData.shipping_amount
    );

    // Update line totals for each item
    const updatedItems = formData.items.map(item => ({
      ...item,
      line_total: calculateLineTotal(
        item.quantity,
        item.unit_price,
        item.discount_percentage,
        item.discount_amount
      ),
    }));

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  }, [
    formData.items.length,
    formData.discount_percentage,
    formData.discount_amount,
    formData.tax_percentage,
    formData.shipping_amount,
  ]);

  // Add product to quotation
  const addProduct = (product: ProductOption) => {
    const newItem: QuotationFormItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku || '',
      quantity: 1,
      unit_price: product.price,
      discount_percentage: 0,
      discount_amount: 0,
      line_total: product.price,
      sort_order: formData.items.length,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setShowProductDialog(false);
    setProductSearch('');
    setProducts([]);
  };

  // Remove item from quotation
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update item
  const updateItem = (index: number, field: keyof QuotationFormItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate line total when quantity, price, or discount changes
          if (['quantity', 'unit_price', 'discount_percentage', 'discount_amount'].includes(field)) {
            updatedItem.line_total = calculateLineTotal(
              updatedItem.quantity,
              updatedItem.unit_price,
              updatedItem.discount_percentage,
              updatedItem.discount_amount
            );
          }

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    } else if (new Date(formData.valid_until) <= new Date()) {
      newErrors.valid_until = 'Valid until date must be in the future';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate discount (either percentage or amount, not both)
    if (formData.discount_percentage > 0 && formData.discount_amount > 0) {
      newErrors.discount = 'Cannot specify both discount percentage and amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save quotation
  const saveQuotation = async (sendAfterSave = false) => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim() || undefined,
        customer_company: formData.customer_company.trim() || undefined,
        customer_address: formData.customer_address.trim() || undefined,
        valid_until: new Date(formData.valid_until),
        items: formData.items.map(item => ({
          ...(item.id && { id: item.id }),
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          sort_order: item.sort_order,
        })),
        discount_percentage: formData.discount_percentage,
        discount_amount: formData.discount_amount,
        tax_percentage: formData.tax_percentage,
        shipping_amount: formData.shipping_amount,
        currency: formData.currency,
        notes: formData.notes.trim() || undefined,
        internal_notes: formData.internal_notes.trim() || undefined,
        terms_and_conditions: formData.terms_and_conditions.trim() || undefined,
      };

      let savedQuotation: QuotationWithDetails;

      if (isEditing) {
        savedQuotation = await quotationsApi.updateQuotation(id!, payload as UpdateQuotationInput);
      } else {
        savedQuotation = await quotationsApi.createQuotation(payload as CreateQuotationInput);
      }

      // Send quotation if requested
      if (sendAfterSave) {
        await quotationsApi.sendQuotation(savedQuotation.id);
      }

      // Navigate to the quotation details page
      navigate(`/admin/quotations/${savedQuotation.id}`);
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      setError(err.message || 'Failed to save quotation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculations = calculateQuotationTotals(
    formData.items,
    formData.discount_percentage,
    formData.discount_amount,
    formData.tax_percentage,
    formData.shipping_amount
  );

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
                <h1 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Quotation' : 'New Quotation'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => saveQuotation(false)}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              <Button
                onClick={() => saveQuotation(true)}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Save & Send
              </Button>
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
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
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
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Enter customer name"
                      className={errors.customer_name ? 'border-red-500' : ''}
                    />
                    {errors.customer_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="Enter email address"
                      className={errors.customer_email ? 'border-red-500' : ''}
                    />
                    {errors.customer_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.customer_email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customer_phone">Phone</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer_company">Company</Label>
                    <Input
                      id="customer_company"
                      value={formData.customer_company}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_company: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_address">Address</Label>
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                    placeholder="Enter customer address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quotation Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Quotation Items ({formData.items.length})
                  </span>
                  <Button onClick={() => setShowProductDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.items && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{errors.items}</AlertDescription>
                  </Alert>
                )}

                {formData.items.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items added</h3>
                    <p className="text-gray-600 mb-4">Add products to this quotation.</p>
                    <Button onClick={() => setShowProductDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={`${item.product_id}-${index}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                            {item.product_sku && (
                              <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`unit_price-${index}`}>Unit Price</Label>
                            <Input
                              id={`unit_price-${index}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`discount-${index}`}>Discount %</Label>
                            <Input
                              id={`discount-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percentage}
                              onChange={(e) => {
                                updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0);
                                if (parseFloat(e.target.value) > 0) {
                                  updateItem(index, 'discount_amount', 0);
                                }
                              }}
                            />
                          </div>

                          <div>
                            <Label>Line Total</Label>
                            <div className="h-10 flex items-center font-medium text-gray-900">
                              {formatCurrency(item.line_total, formData.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Customer Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes visible to customer"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="internal_notes">Internal Notes</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                    placeholder="Internal notes (not visible to customer)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                  <Textarea
                    id="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                    placeholder="Terms and conditions"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quotation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quotation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="valid_until">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    className={errors.valid_until ? 'border-red-500' : ''}
                  />
                  {errors.valid_until && (
                    <p className="text-sm text-red-600 mt-1">{errors.valid_until}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing & Discounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="discount_percentage">Discount %</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          discount_percentage: value,
                          ...(value > 0 && { discount_amount: 0 }),
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          discount_amount: value,
                          ...(value > 0 && { discount_percentage: 0 }),
                        }));
                      }}
                    />
                  </div>
                </div>

                {errors.discount && (
                  <p className="text-sm text-red-600">{errors.discount}</p>
                )}

                <div>
                  <Label htmlFor="tax_percentage">Tax %</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_amount">Shipping Amount</Label>
                  <Input
                    id="shipping_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(calculations.subtotal, formData.currency)}</span>
                  </div>

                  {calculations.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(calculations.discount_amount, formData.currency)}</span>
                    </div>
                  )}

                  {calculations.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span>{formatCurrency(calculations.tax_amount, formData.currency)}</span>
                    </div>
                  )}

                  {calculations.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span>{formatCurrency(calculations.shipping_amount, formData.currency)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculations.total_amount, formData.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Search and select products to add to the quotation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products by name, SKU, or category..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  searchProducts(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {searchingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span>Searching products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  {productSearch.trim() ? (
                    <p className="text-gray-500">No products found for "{productSearch}"</p>
                  ) : (
                    <p className="text-gray-500">Start typing to search products</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex items-center space-x-4">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          {product.sku && (
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          )}
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.price)}</p>
                        <Badge variant={product.in_stock ? 'default' : 'secondary'}>
                          {product.in_stock ? `${product.stock_quantity} in stock` : 'Out of stock'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationForm;