import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Tag, Calendar, Percent, DollarSign } from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PromoCodeFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'order' | 'product';
  product_skus: string;
  max_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const PromoCodeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    applies_to: 'order',
    product_skus: '',
    max_uses: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PromoCodeFormData, string>>>({});

  // Fetch promo code for editing
  const { data: promoCode, isLoading } = useQuery({
    queryKey: ['admin-promo-code', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`/admin/promo-codes/${id}`);
      return response;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (promoCode) {
      setFormData({
        code: promoCode.code,
        description: promoCode.description || '',
        discount_type: promoCode.discount_type,
        discount_value: parseFloat(promoCode.discount_value),
        applies_to: promoCode.applies_to,
        product_skus: promoCode.product_skus.join(', '),
        max_uses: promoCode.max_uses,
        start_date: format(new Date(promoCode.start_date), 'yyyy-MM-dd'),
        end_date: promoCode.end_date ? format(new Date(promoCode.end_date), 'yyyy-MM-dd') : '',
        is_active: promoCode.is_active,
      });
    }
  }, [promoCode]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/promo-codes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['promo-code-stats'] });
      toast.success('Promo code created successfully');
      navigate('/admin/promo-codes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create promo code');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/admin/promo-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['promo-code-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-promo-code', id] });
      toast.success('Promo code updated successfully');
      navigate('/admin/promo-codes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update promo code');
    },
  });

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PromoCodeFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Promo code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Code can only contain uppercase letters, numbers, hyphens, and underscores';
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Discount value must be greater than 0';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage discount cannot exceed 100%';
    }

    if (formData.applies_to === 'product' && !formData.product_skus.trim()) {
      newErrors.product_skus = 'Product SKUs are required when applying to specific products';
    }

    if (formData.max_uses < 0) {
      newErrors.max_uses = 'Max uses must be 0 or greater';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData: any = {
      code: formData.code.toUpperCase(),
      description: formData.description || undefined,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      applies_to: formData.applies_to,
      product_skus: formData.product_skus
        ? formData.product_skus.split(',').map((sku) => sku.trim()).filter(Boolean)
        : [],
      max_uses: formData.max_uses,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      is_active: formData.is_active,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: keyof PromoCodeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading promo code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/promo-codes')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Promo Codes
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Promo Code' : 'Create New Promo Code'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditing ? 'Update promo code details' : 'Create a new discount code for customers'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Code Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Code Information
            </CardTitle>
            <CardDescription>Basic details about the promo code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Promo Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className={cn(errors.code && 'border-red-300')}
                  disabled={isEditing} // Don't allow editing code
                />
                {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Only uppercase letters, numbers, hyphens, and underscores
                </p>
              </div>

              <div>
                <Label htmlFor="is_active" className="flex items-center justify-between">
                  Status
                </Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="text-sm">
                    {formData.is_active ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="20% off entire order"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Optional description for internal use</p>
            </div>
          </CardContent>
        </Card>

        {/* Discount Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Discount Details
            </CardTitle>
            <CardDescription>Configure the discount type and amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    handleInputChange('discount_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percentage (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Fixed Amount ($)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount_value">Discount Value *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                  className={cn(errors.discount_value && 'border-red-300')}
                />
                {errors.discount_value && (
                  <p className="text-xs text-red-600 mt-1">{errors.discount_value}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discount_type === 'percentage'
                    ? 'Enter percentage (0-100)'
                    : 'Enter dollar amount'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applies_to">Applies To *</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value: 'order' | 'product') =>
                    handleInputChange('applies_to', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Entire Order</SelectItem>
                    <SelectItem value="product">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose whether discount applies to entire order or specific products
                </p>
              </div>

              {formData.applies_to === 'product' && (
                <div>
                  <Label htmlFor="product_skus">Product SKUs *</Label>
                  <Input
                    id="product_skus"
                    value={formData.product_skus}
                    onChange={(e) => handleInputChange('product_skus', e.target.value)}
                    placeholder="SKU001, SKU002, SKU003"
                    className={cn(errors.product_skus && 'border-red-300')}
                  />
                  {errors.product_skus && (
                    <p className="text-xs text-red-600 mt-1">{errors.product_skus}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of product SKUs
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits and Validity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Usage & Validity
            </CardTitle>
            <CardDescription>Set usage limits and validity period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_uses">Maximum Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="0"
                value={formData.max_uses}
                onChange={(e) => handleInputChange('max_uses', parseInt(e.target.value) || 0)}
                className={cn(errors.max_uses && 'border-red-300')}
              />
              {errors.max_uses && <p className="text-xs text-red-600 mt-1">{errors.max_uses}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Set to 0 for unlimited uses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={cn(errors.start_date && 'border-red-300')}
                />
                {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={cn(errors.end_date && 'border-red-300')}
                />
                {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/promo-codes')}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Promo Code'
              : 'Create Promo Code'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeForm;
