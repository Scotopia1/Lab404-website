// Quotation TypeScript interfaces for frontend
// Matches backend models from lab404-backend/src/models/Quotation.ts

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
  EXPIRED = 'expired'
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_description: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationStatusHistory {
  id: string;
  quotation_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  reason: string | null;
  notes: string | null;
  created_at: Date;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  customer_address: string | null;
  status: QuotationStatus;
  valid_until: Date;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  internal_notes: string | null;
  terms_and_conditions: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: Date | null;
  sent_at: Date | null;
  converted_order_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationWithDetails extends Quotation {
  items: QuotationItem[];
  created_by_name: string;
  approved_by_name: string | null;
  item_count: number;
  status_history?: QuotationStatusHistory[];
}

export interface CreateQuotationInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  customer_address?: string;
  valid_until: Date;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    sort_order?: number;
  }[];
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  shipping_amount?: number;
  currency?: string;
  notes?: string;
  internal_notes?: string;
  terms_and_conditions?: string;
}

export interface UpdateQuotationInput {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
  customer_address?: string;
  valid_until?: Date;
  items?: {
    id?: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    sort_order?: number;
  }[];
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  shipping_amount?: number;
  currency?: string;
  notes?: string;
  internal_notes?: string;
  terms_and_conditions?: string;
}

export interface ChangeQuotationStatusInput {
  status: QuotationStatus;
  reason?: string;
  notes?: string;
}

export interface QuotationFilters {
  status?: QuotationStatus | QuotationStatus[];
  customer_email?: string;
  customer_name?: string;
  created_by?: string;
  date_from?: Date;
  date_to?: Date;
  valid_from?: Date;
  valid_to?: Date;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  sort_by?: 'created_at' | 'valid_until' | 'total_amount' | 'status' | 'quotation_number';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface QuotationSummary {
  total_quotations: number;
  total_value: number;
  average_quotation_value: number;
  quotations_by_status: Record<QuotationStatus, number>;
  conversion_rate: number;
  recent_quotations: QuotationWithDetails[];
}

export interface QuotationCalculation {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
}

// Frontend-specific form interfaces
export interface QuotationFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  customer_address: string;
  valid_until: string; // ISO date string for form inputs
  items: QuotationFormItem[];
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  shipping_amount: number;
  currency: string;
  notes: string;
  internal_notes: string;
  terms_and_conditions: string;
}

export interface QuotationFormItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
}

// Product selection interface for the form
export interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  description: string | null;
  in_stock: boolean;
  stock_quantity: number;
  category: string;
  images: string[];
}

// Utility functions
export const getQuotationStatusColor = (status: QuotationStatus): string => {
  const colors = {
    [QuotationStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [QuotationStatus.SENT]: 'bg-blue-100 text-blue-800',
    [QuotationStatus.APPROVED]: 'bg-green-100 text-green-800',
    [QuotationStatus.REJECTED]: 'bg-red-100 text-red-800',
    [QuotationStatus.CONVERTED]: 'bg-purple-100 text-purple-800',
    [QuotationStatus.EXPIRED]: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status];
};

export const getQuotationStatusBadgeVariant = (status: QuotationStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case QuotationStatus.APPROVED:
    case QuotationStatus.CONVERTED:
      return 'default';
    case QuotationStatus.REJECTED:
    case QuotationStatus.EXPIRED:
      return 'destructive';
    case QuotationStatus.SENT:
      return 'secondary';
    default:
      return 'outline';
  }
};

export const formatQuotationStatus = (status: QuotationStatus): string => {
  const statusLabels = {
    [QuotationStatus.DRAFT]: 'Draft',
    [QuotationStatus.SENT]: 'Sent',
    [QuotationStatus.APPROVED]: 'Approved',
    [QuotationStatus.REJECTED]: 'Rejected',
    [QuotationStatus.CONVERTED]: 'Converted',
    [QuotationStatus.EXPIRED]: 'Expired',
  };
  return statusLabels[status];
};

export const canEditQuotation = (quotation: Quotation): boolean => {
  return quotation.status === QuotationStatus.DRAFT;
};

export const canSendQuotation = (quotation: Quotation): boolean => {
  return quotation.status === QuotationStatus.DRAFT && quotation.total_amount > 0;
};

export const canApproveQuotation = (quotation: Quotation): boolean => {
  return quotation.status === QuotationStatus.SENT && new Date() <= new Date(quotation.valid_until);
};

export const canRejectQuotation = (quotation: Quotation): boolean => {
  return quotation.status === QuotationStatus.SENT && new Date() <= new Date(quotation.valid_until);
};

export const canConvertQuotation = (quotation: Quotation): boolean => {
  return quotation.status === QuotationStatus.APPROVED &&
         new Date() <= new Date(quotation.valid_until) &&
         !quotation.converted_order_id;
};

export const isQuotationExpired = (quotation: Quotation): boolean => {
  return new Date() > new Date(quotation.valid_until) &&
         (quotation.status === QuotationStatus.SENT || quotation.status === QuotationStatus.APPROVED);
};

export const calculateLineTotal = (
  quantity: number,
  unitPrice: number,
  discountPercentage: number = 0,
  discountAmount: number = 0
): number => {
  const itemSubtotal = quantity * unitPrice;
  let itemDiscount = 0;

  if (discountPercentage > 0) {
    itemDiscount = itemSubtotal * (discountPercentage / 100);
  } else if (discountAmount > 0) {
    itemDiscount = Math.min(discountAmount, itemSubtotal);
  }

  return Number((itemSubtotal - itemDiscount).toFixed(2));
};

export const calculateQuotationTotals = (
  items: { quantity: number; unit_price: number; discount_percentage?: number; discount_amount?: number }[],
  globalDiscountPercentage: number = 0,
  globalDiscountAmount: number = 0,
  taxPercentage: number = 0,
  shippingAmount: number = 0
): QuotationCalculation => {
  // Calculate line totals for each item
  const itemTotals = items.map(item => {
    const itemSubtotal = item.quantity * item.unit_price;
    let itemDiscount = 0;

    if (item.discount_percentage && item.discount_percentage > 0) {
      itemDiscount = itemSubtotal * (item.discount_percentage / 100);
    } else if (item.discount_amount && item.discount_amount > 0) {
      itemDiscount = Math.min(item.discount_amount, itemSubtotal);
    }

    return itemSubtotal - itemDiscount;
  });

  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

  // Apply global discount
  let globalDiscount = 0;
  if (globalDiscountPercentage > 0) {
    globalDiscount = subtotal * (globalDiscountPercentage / 100);
  } else if (globalDiscountAmount > 0) {
    globalDiscount = Math.min(globalDiscountAmount, subtotal);
  }

  const discountedSubtotal = subtotal - globalDiscount;

  // Calculate tax on discounted subtotal
  const tax_amount = discountedSubtotal * (taxPercentage / 100);

  const total_amount = discountedSubtotal + tax_amount + shippingAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_amount: Number(globalDiscount.toFixed(2)),
    tax_amount: Number(tax_amount.toFixed(2)),
    shipping_amount: Number(shippingAmount.toFixed(2)),
    total_amount: Number(total_amount.toFixed(2)),
  };
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};